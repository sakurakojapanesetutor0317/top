/* Sakura Japanese Practice — switches views inside game.html.
   #menu (default) · #listening · #conversation · #flashcards · #speaking
   Design-check helper for Listening: game.html#listening?q=5&demo=selected|correct|wrong */
(function () {
  'use strict';
  var MODES = {
    listening: function () { return window.ListeningMode; },
    conversation: function () { return window.ConversationMode; },
    flashcards: function () { return window.FlashcardsMode; },
    speaking: function () { return window.SpeakingMode; }
  };
  var current = null;
  function show(view) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('hidden', v.id !== 'view-' + view); });
    window.scrollTo(0, 0);
  }
  function leave() {
    // stop whatever the previous mode was doing (audio, microphone)
    if (current && MODES[current] && MODES[current]().leave) MODES[current]().leave();
    try { SJ.stop(); } catch (e) { /* ignore */ }
  }
  function route() {
    var h = location.hash.replace('#', ''), parts = h.split('?'), name = parts[0] || 'menu';
    var params = {}; (parts[1] || '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) params[a[0]] = decodeURIComponent(a[1] || ''); });
    leave();
    if (MODES[name] && MODES[name]()) {
      current = name; show(name);
      MODES[name]().start({ q: Number(params.q) || 0, demo: params.demo });
      return;
    }
    current = null; show('menu');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-go]');
    if (!b) return;
    var to = b.getAttribute('data-go');
    if (location.hash.replace('#', '') === to) { route(); return; }
    location.hash = to;
  });
  window.addEventListener('hashchange', route);
  route();
})();
