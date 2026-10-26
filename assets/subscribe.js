// Sends the subscribe form (_includes/subscribe.html) without leaving the page.
// Without JavaScript the form posts normally and the sign-up function redirects to a /subscribe/ status page.
(function () {
  var messages = {
    sending: 'Sending…',
    ok: 'Almost done. Check your inbox for an email with a link to confirm.',
    invalid_email: 'That email address does not look right. Check it and try again.',
    rate_limited: 'Too many attempts. Wait a minute and try again.',
    failed: 'That did not work. Try again in a minute, or email me instead.'
  };

  document.querySelectorAll('form[data-subscribe]').forEach(function (form) {
    if (form.dataset.ready) return;
    form.dataset.ready = 'true';
    var status = form.querySelector('.subscribe-status');
    var button = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      button.disabled = true;
      status.textContent = messages.sending;
      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form))
      })
        .then(function (response) {
          return response.json().catch(function () { return { ok: false }; });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            status.textContent = messages.ok;
          } else {
            status.textContent = messages[result.error] || messages.failed;
          }
        })
        .catch(function () {
          status.textContent = messages.failed;
        })
        .then(function () {
          button.disabled = false;
        });
    });
  });
})();
