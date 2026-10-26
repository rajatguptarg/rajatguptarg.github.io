# frozen_string_literal: true

# Tests for newsletter.rb. Resend and the live site are replaced by fakes; the real posts in
# this repository are loaded with Jekyll.
# Run: JEKYLL_ENV=production bundle exec ruby .github/scripts/test/newsletter_test.rb
require "minitest/autorun"
require "json"
require_relative "../newsletter"

class FakeNewsletter < Newsletter
  Failed = Class.new(StandardError)
  Response = Struct.new(:body)

  attr_reader :calls, :lines, :live_checks

  def initialize(broadcasts: [], live: true, **options)
    super(**options)
    @broadcasts = broadcasts
    @live = live
    @calls = []
    @lines = []
    @live_checks = 0
  end

  private

  # Loading the site takes about a second, so all tests share one copy.
  def load_site
    self.class.instance_variable_get(:@site) || self.class.instance_variable_set(:@site, super)
  end

  def resend(method, path, body = nil, retry_server_errors: true)
    @calls << { method: method, path: path, body: body }
    data = method == :get && path == "/broadcasts" ? { object: "list", has_more: false, data: @broadcasts } : { id: "id_#{@calls.size}" }
    Response.new(JSON.generate(data))
  end

  def http_status(_url)
    @live_checks += 1
    @live ? 200 : 404
  end

  def sleep(_seconds); end

  def log(message)
    @lines << message
  end

  def fail_with(message)
    raise Failed, message
  end
end

class NewsletterTest < Minitest::Test
  GITOPS = "_posts/2026-03-25-gitops.markdown"
  SETTINGS = {
    "RESEND_API_KEY" => "re_test",
    "RESEND_SEGMENT_ID" => "seg_1",
    "NEWSLETTER_FROM" => "Rajat Gupta <newsletter@rajatgupta.work>",
  }.freeze

  def newsletter(env: {}, **options)
    FakeNewsletter.new(env: SETTINGS.merge(env), **options)
  end

  def posts_sent(run)
    run.calls.select { |c| c[:method] == :post && c[:path] == "/broadcasts" }.map { |c| c[:body] }
  end

  def test_sends_a_named_post_as_a_broadcast
    run = newsletter(mode: "send", post: GITOPS)
    run.run

    sent = posts_sent(run)
    assert_equal 1, sent.size
    body = sent.first
    assert_equal "seg_1", body[:segment_id]
    assert_equal "Rajat Gupta <newsletter@rajatgupta.work>", body[:from]
    assert_equal "GitOps: Beyond the Hype", body[:subject]
    assert_equal "Post: /posts/gitops/", body[:name]
    assert_equal true, body[:send]
    assert_includes body[:html], "https://rajatgupta.work/posts/gitops/"
    assert_includes body[:html], "{{{RESEND_UNSUBSCRIBE_URL}}}"
    assert_includes body[:html], "It is holiday, and your on-call engineer"
    assert_includes body[:text], "Read the post: https://rajatgupta.work/posts/gitops/"
    assert_includes body[:text], "Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}"
    refute body.key?(:topic_id)
  end

  def test_optional_reply_to_and_topic_are_passed_on
    run = newsletter(mode: "send", post: GITOPS, env: { "NEWSLETTER_REPLY_TO" => "contact@rajatgupta.work", "RESEND_TOPIC_ID" => "topic_1" })
    run.run
    body = posts_sent(run).first
    assert_equal "contact@rajatgupta.work", body[:reply_to]
    assert_equal "topic_1", body[:topic_id]
    assert_includes body[:html], "Reply to this email to reach me."
  end

  def test_skips_a_post_that_was_already_sent
    run = newsletter(mode: "send", post: GITOPS, broadcasts: [{ "name" => "Post: /posts/gitops/", "status" => "sent" }])
    run.run
    assert_empty posts_sent(run)
    assert(run.lines.any? { |l| l.include?("Already sent") })
  end

  def test_recognises_a_post_sent_under_an_old_url
    old = "Post: /gitops/kubernetes/devops/argocd/flux/cncf/cd/2026/03/25/gitops/"
    run = newsletter(mode: "send", post: GITOPS, broadcasts: [{ "name" => old, "status" => "sent" }])
    run.run
    assert_empty posts_sent(run)
  end

  def test_a_leftover_draft_does_not_count_as_sent
    run = newsletter(mode: "send", post: GITOPS, broadcasts: [{ "name" => "Post: /posts/gitops/", "status" => "draft" }])
    run.run
    assert_equal 1, posts_sent(run).size
  end

  def test_does_not_send_a_post_that_is_not_live
    run = newsletter(mode: "send", post: GITOPS, live: false, wait: 60)
    run.run
    assert_empty posts_sent(run)
    assert_equal 3, run.live_checks, "checks at 0, 30 and 60 seconds"
  end

  def test_recent_posts_are_sent_once_each
    run = newsletter(mode: "send", env: { "NEWSLETTER_LOOKBACK_DAYS" => "100000", "NEWSLETTER_MAX_PER_RUN" => "100" })
    run.run
    names = posts_sent(run).map { |b| b[:name] }
    assert_operator names.size, :>=, 8
    assert_equal names.uniq, names
  end

  def test_stops_without_sending_when_too_many_posts_qualify
    run = newsletter(mode: "send", env: { "NEWSLETTER_LOOKBACK_DAYS" => "100000" })
    error = assert_raises(FakeNewsletter::Failed) { run.run }
    assert_match(/more than NEWSLETTER_MAX_PER_RUN \(2\)/, error.message)
    assert_empty posts_sent(run)
  end

  # A zero-day window leaves every published post outside it, whatever the date of the newest post.
  def test_posts_outside_the_window_are_not_sent
    run = newsletter(mode: "send", env: { "NEWSLETTER_LOOKBACK_DAYS" => "0" })
    run.run
    assert_empty run.calls, "with no recent posts, Resend is not called at all"
  end

  def test_front_matter_can_opt_a_post_out
    doc = Struct.new(:data, :relative_path)
    kept = doc.new({}, "_posts/a.md")
    skipped = doc.new({ "newsletter" => false }, "_posts/b.md")
    assert_equal [kept], newsletter(mode: "send").send(:opted_in, [kept, skipped])
  end

  def test_unknown_post_path_fails
    error = assert_raises(FakeNewsletter::Failed) { newsletter(mode: "send", post: "_posts/2099-01-01-nope.md").run }
    assert_match(/is not a published post/, error.message)
  end

  def test_missing_settings_fail_before_anything_happens
    run = FakeNewsletter.new(mode: "send", post: GITOPS, env: { "RESEND_API_KEY" => "re_test" })
    error = assert_raises(FakeNewsletter::Failed) { run.run }
    assert_match(/RESEND_SEGMENT_ID, NEWSLETTER_FROM/, error.message)
    assert_empty run.calls
  end

  def test_automatic_runs_skip_quietly_until_configured
    run = FakeNewsletter.new(mode: "send", skip_if_unconfigured: true, env: { "RESEND_API_KEY" => "re_test" })
    exit_error = assert_raises(SystemExit) { run.run }
    assert_equal 0, exit_error.status
    assert(run.lines.any? { |l| l.include?("not set up yet") })
    assert_empty run.calls
  end

  def test_test_mode_sends_one_email_to_the_given_address
    run = newsletter(mode: "test", post: GITOPS, test_email: "me@example.com")
    run.run
    assert_equal 1, run.calls.size
    call = run.calls.first
    assert_equal "/emails", call[:path]
    assert_equal ["me@example.com"], call[:body][:to]
    assert_equal "[Test] GitOps: Beyond the Hype", call[:body][:subject]
    refute_includes call[:body][:html], "RESEND_UNSUBSCRIBE_URL"
  end

  def test_preview_mode_writes_files_and_makes_no_calls
    run = newsletter(mode: "preview", post: GITOPS, env: { "RESEND_API_KEY" => "" })
    run.run
    assert_empty run.calls
    html = File.join(Newsletter::PREVIEW_DIR, "2026-03-25-gitops.html")
    assert File.exist?(html)
    assert_includes File.read(html, encoding: "UTF-8"), "13 min read"
  end
end
