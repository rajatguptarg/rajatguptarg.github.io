# frozen_string_literal: true

# Emails new posts to subscribers as Resend broadcasts. Run by .github/workflows/newsletter.yml.
#
#   bundle exec ruby .github/scripts/newsletter.rb [--mode send|preview|test] [--post PATH]
#                                                  [--test-email ADDRESS] [--wait SECONDS]
#
# The site is loaded with Jekyll itself, so post URLs, drafts (published: false) and
# future-dated posts are handled exactly as in the live build. A post is emailed when:
#   - it is published and dated within the last NEWSLETTER_LOOKBACK_DAYS days (default 7),
#     or it was named with --post;
#   - its front matter does not say `newsletter: false`;
#   - no earlier broadcast exists for it. Broadcasts are named "Post: <path>", which is how
#     a post that was already sent is recognised, also under old paths in redirect_from;
#   - it is live on the site (checked for up to --wait seconds, for GitHub Pages to deploy).
#
# Modes: send emails the segment; preview writes the email to newsletter-preview/ without
# any network calls; test sends the email only to --test-email.
#
# With --skip-if-unconfigured (used by automatic runs), missing settings end the run quietly
# instead of failing it.
#
# Settings come from the environment: RESEND_API_KEY, RESEND_SEGMENT_ID, NEWSLETTER_FROM,
# and optionally NEWSLETTER_REPLY_TO, RESEND_TOPIC_ID, NEWSLETTER_LOOKBACK_DAYS and
# NEWSLETTER_MAX_PER_RUN (default 2; more candidates than this stops the run unsent).

require "cgi"
require "erb"
require "fileutils"
require "json"
require "net/http"
require "optparse"
require "set"
require "tmpdir"
require "uri"
require "jekyll"

class Newsletter
  ROOT = File.expand_path("../..", __dir__)
  TEMPLATE = File.join(__dir__, "newsletter-email.html.erb")
  PREVIEW_DIR = File.join(ROOT, "newsletter-preview")
  UNSUBSCRIBE_PLACEHOLDER = "{{{RESEND_UNSUBSCRIBE_URL}}}"
  RECHECK_SECONDS = 30

  def initialize(mode:, post: nil, test_email: nil, wait: 0, skip_if_unconfigured: false, env: ENV)
    @mode = mode
    @skip_if_unconfigured = skip_if_unconfigured
    @post_path = post&.sub(%r{\A\./}, "")
    @test_email = test_email
    @wait = wait
    @env = env
    @api_base = env.fetch("RESEND_API_BASE", "https://api.resend.com")
    @summary = []
  end

  def run
    check_settings
    site = load_site
    @site_info = {
      url: site.config["url"].chomp("/"),
      title: site.config["title"],
      host: URI(site.config["url"]).host,
    }

    posts = candidates(site)
    if posts.empty?
      log "No posts to email."
      return finish
    end

    already_sent = @mode == "send" ? sent_broadcast_names : Set.new
    posts.each { |doc| handle(site, doc, already_sent) }
    finish
  end

  private

  # ---------- Choosing posts ----------

  def candidates(site)
    published = site.posts.docs
    if @post_path
      doc = published.find { |d| d.relative_path == @post_path }
      fail_with "#{@post_path} is not a published post. Check the path, its date (future posts are skipped) and `published:`." unless doc
      return opted_in([doc])
    end

    lookback_days = Integer(@env.fetch("NEWSLETTER_LOOKBACK_DAYS", "7"))
    max_per_run = Integer(@env.fetch("NEWSLETTER_MAX_PER_RUN", "2"))
    cutoff = Time.now - (lookback_days * 86_400)
    recent = opted_in(published.select { |d| d.date >= cutoff })
    log "Posts dated in the last #{lookback_days} days: #{recent.size}"
    if recent.size > max_per_run
      fail_with "#{recent.size} posts are candidates, more than NEWSLETTER_MAX_PER_RUN (#{max_per_run}). " \
                "Nothing was sent. If this is intended, send them one at a time with --post, or raise the limit."
    end
    recent
  end

  def opted_in(docs)
    docs.reject do |doc|
      next false unless doc.data["newsletter"] == false

      log "Skipping #{doc.relative_path}: front matter says newsletter: false"
      true
    end
  end

  # ---------- One post ----------

  def handle(site, doc, already_sent)
    post = email_fields(site, doc)
    name = broadcast_name(doc.url)
    log "\n#{post[:title]}\n  #{post[:url]}"

    if @mode == "preview"
      write_preview(doc, post)
      return
    end

    if @mode == "send"
      sent_as = ([doc.url] + Array(doc.data["redirect_from"])).map { |path| broadcast_name(path) }.find { |n| already_sent.include?(n) }
      if sent_as
        log "  Already sent (broadcast \"#{sent_as}\"). Skipping."
        @summary << "Already sent: [#{post[:title]}](#{post[:url]})"
        return
      end

      unless live?(post[:url])
        warn "::warning::#{post[:url]} is not live yet. Not sent; the next run will try again."
        @summary << "Not live yet, not sent: [#{post[:title]}](#{post[:url]})"
        return
      end
    end

    @mode == "test" ? send_test(post) : send_broadcast(post, name)
  end

  def email_fields(site, doc)
    words = strip_html(doc.content).split.size
    {
      title: doc.data["title"],
      description: doc.data["description"],
      url: "#{@site_info[:url]}#{doc.url}",
      date: doc.date.strftime("%-d %B %Y"),
      # Same rule as _includes/reading-time.html: 230 words a minute, rounded, at least one minute.
      minutes: [(words + 115) / 230, 1].max,
      excerpt_html: excerpt_html(site, doc),
    }
  end

  # The post's first paragraph, when it is a paragraph of text (not an image), with links made absolute.
  def excerpt_html(site, doc)
    excerpt = doc.data["excerpt"]
    html = excerpt.respond_to?(:output) && excerpt.output ? excerpt.output : excerpt.to_s
    html = html.strip
    return nil unless html.start_with?("<p>") && !html.include?("<img")

    html.gsub(/(href|src)="\//, %(\\1="#{@site_info[:url]}/))
        .sub("<p>", '<p style="margin:0;">')
  end

  def render(post, unsubscribe_url:)
    reply_to = @env["NEWSLETTER_REPLY_TO"].to_s.strip
    reply_to = nil if reply_to.empty?
    site = @site_info
    ERB.new(File.read(TEMPLATE, encoding: "UTF-8"), trim_mode: "-").result(binding)
  end

  def text_version(post, unsubscribe_url:)
    [
      post[:title],
      "",
      post[:description],
      "",
      post[:excerpt_html] && strip_html(post[:excerpt_html]).strip,
      "",
      "Read the post: #{post[:url]}",
      "",
      "--",
      "You get this email because you subscribed to new posts at #{@site_info[:host]}.",
      "Unsubscribe: #{unsubscribe_url}",
    ].compact.join("\n").gsub(/\n{3,}/, "\n\n")
  end

  # ---------- Output ----------

  def write_preview(doc, post)
    FileUtils.mkdir_p(PREVIEW_DIR)
    base = File.join(PREVIEW_DIR, File.basename(doc.relative_path, ".*"))
    File.write("#{base}.html", render(post, unsubscribe_url: UNSUBSCRIBE_PLACEHOLDER))
    File.write("#{base}.txt", text_version(post, unsubscribe_url: UNSUBSCRIBE_PLACEHOLDER))
    log "  Preview written to #{base.delete_prefix("#{ROOT}/")}.html and .txt"
    @summary << "Preview: [#{post[:title]}](#{post[:url]})"
  end

  def send_test(post)
    unsubscribe = "#{@site_info[:url]}/subscribe/"
    body = {
      from: @env["NEWSLETTER_FROM"],
      to: [@test_email],
      subject: "[Test] #{post[:title]}",
      html: render(post, unsubscribe_url: unsubscribe),
      text: text_version(post, unsubscribe_url: unsubscribe),
    }
    body[:reply_to] = @env["NEWSLETTER_REPLY_TO"] unless @env["NEWSLETTER_REPLY_TO"].to_s.strip.empty?
    response = resend(:post, "/emails", body, retry_server_errors: false)
    log "  Test email sent to #{@test_email} (id #{JSON.parse(response.body)["id"]})"
    @summary << "Test sent to #{@test_email}: [#{post[:title]}](#{post[:url]})"
  end

  def send_broadcast(post, name)
    body = {
      segment_id: @env["RESEND_SEGMENT_ID"],
      from: @env["NEWSLETTER_FROM"],
      subject: post[:title],
      name: name,
      html: render(post, unsubscribe_url: UNSUBSCRIBE_PLACEHOLDER),
      text: text_version(post, unsubscribe_url: UNSUBSCRIBE_PLACEHOLDER),
      send: true,
    }
    body[:reply_to] = @env["NEWSLETTER_REPLY_TO"] unless @env["NEWSLETTER_REPLY_TO"].to_s.strip.empty?
    body[:topic_id] = @env["RESEND_TOPIC_ID"] unless @env["RESEND_TOPIC_ID"].to_s.strip.empty?
    # Not retried on server errors: the broadcast may have gone out. A re-run is safe because
    # it skips posts that already have a broadcast.
    response = resend(:post, "/broadcasts", body, retry_server_errors: false)
    log "  Broadcast sent (id #{JSON.parse(response.body)["id"]})"
    @summary << "Sent: [#{post[:title]}](#{post[:url]})"
  end

  def finish
    summary_file = @env["GITHUB_STEP_SUMMARY"]
    return if summary_file.to_s.empty? || @summary.empty?

    File.open(summary_file, "a") { |f| f.puts("### Newsletter (#{@mode})", "", *@summary.map { |line| "- #{line}" }) }
  end

  # ---------- Resend and the live site ----------

  def broadcast_name(path)
    "Post: #{path}"
  end

  def sent_broadcast_names
    # Without a limit, Resend returns every broadcast in one response.
    broadcasts = JSON.parse(resend(:get, "/broadcasts").body).fetch("data", [])
    broadcasts.reject { |b| b["status"] == "draft" }.map { |b| b["name"] }.compact.to_set
  end

  # Checks once, then every RECHECK_SECONDS until --wait seconds have passed.
  def live?(url)
    checks = (@wait / RECHECK_SECONDS) + 1
    checks.times do |check|
      # The query string gets past any cached 404 from before the deploy.
      status = http_status("#{url}?newsletter-check=#{Time.now.to_i}")
      return true if status == 200
      break if check == checks - 1

      log "  Not live yet (HTTP #{status}). Checking again in #{RECHECK_SECONDS} seconds."
      sleep RECHECK_SECONDS
    end
    false
  end

  def http_status(url)
    uri = URI(url)
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 10, read_timeout: 20) do |http|
      http.request(Net::HTTP::Get.new(uri)).code.to_i
    end
  rescue StandardError => e
    log "  Could not reach #{url}: #{e.class}"
    0
  end

  # Retries rate limits (the request was not processed) and, for safe requests, server errors.
  def resend(method, path, body = nil, retry_server_errors: true)
    uri = URI("#{@api_base}#{path}")
    attempt = 0
    loop do
      attempt += 1
      request = Net::HTTP.const_get(method.to_s.capitalize).new(uri)
      request["Authorization"] = "Bearer #{@env["RESEND_API_KEY"]}"
      request["Content-Type"] = "application/json"
      request["User-Agent"] = "#{@site_info[:host]} newsletter"
      request.body = JSON.generate(body) if body
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 10, read_timeout: 60) do |http|
        http.request(request)
      end
      code = response.code.to_i
      return response if code.between?(200, 299)

      retryable = code == 429 || (code >= 500 && retry_server_errors)
      fail_with "Resend #{method.upcase} #{path} failed: #{code} #{response.body}" unless retryable && attempt < 4

      wait = (response["retry-after"] || (2**attempt)).to_f
      log "  Resend returned #{code}; retrying in #{wait} seconds"
      sleep wait
    end
  end

  # ---------- Setup ----------

  def check_settings
    required = { "send" => %w[RESEND_API_KEY RESEND_SEGMENT_ID NEWSLETTER_FROM], "test" => %w[RESEND_API_KEY NEWSLETTER_FROM], "preview" => [] }
    missing = required.fetch(@mode).select { |name| @env[name].to_s.strip.empty? }
    if missing.any? && @skip_if_unconfigured
      log "::notice::Newsletter is not set up yet (missing #{missing.join(", ")}), so nothing was sent."
      exit 0
    end
    fail_with "Missing settings: #{missing.join(", ")}. See README.md, \"Comments And Email Updates\"." if missing.any?
    fail_with "--test-email is required with --mode test" if @mode == "test" && @test_email.to_s.strip.empty?
  end

  def load_site
    Jekyll.logger.log_level = :error
    config = Jekyll.configuration("source" => ROOT, "destination" => File.join(Dir.tmpdir, "newsletter-site"), "quiet" => true)
    site = Jekyll::Site.new(config)
    site.reset
    site.read
    site.generate
    site.render
    site
  end

  def strip_html(html)
    CGI.unescapeHTML(html.to_s.gsub(/<script.*?<\/script>/m, "").gsub(/<!--.*?-->/m, "").gsub(/<style.*?<\/style>/m, "").gsub(/<.*?>/m, ""))
  end

  def h(text)
    CGI.escapeHTML(text.to_s)
  end

  def log(message)
    puts message
  end

  def fail_with(message)
    warn "::error::#{message}"
    finish
    exit 1
  end
end

if $PROGRAM_NAME == __FILE__
  options = { mode: "send", post: nil, test_email: nil, wait: 0, skip_if_unconfigured: false }
  OptionParser.new do |parser|
    parser.on("--mode MODE", %w[send preview test]) { |v| options[:mode] = v }
    parser.on("--post PATH") { |v| options[:post] = v }
    parser.on("--test-email ADDRESS") { |v| options[:test_email] = v }
    parser.on("--wait SECONDS", Integer) { |v| options[:wait] = v }
    parser.on("--skip-if-unconfigured") { options[:skip_if_unconfigured] = true }
  end.parse!
  Newsletter.new(**options).run
end
