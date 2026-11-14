/* Shared helpers: DOM, HTML escaping, Japanese+romaji block, audio player. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  var audioSrc = function (n) { return n ? 'audio/trial_' + String(n).padStart(2, '0') + '.mp3' : null; };

  // Japanese with romaji directly underneath (and optional English)
  var jr = function (jp, ro, en, cls) {
    return '<span class="jr ' + (cls || '') + '"><span class="jp" lang="ja">' + esc(jp) + '</span>' +
      (ro != null ? '<span class="rom">' + esc(ro) + '</span>' : '') +
      (en != null ? '<span class="en">' + esc(en) + '</span>' : '') + '</span>';
  };

  var SPEAKER = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm12.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06a4.5 4.5 0 0 0 2.5-4.03zm-2.5-8v2.06a6.5 6.5 0 0 1 0 11.88V20a8.5 8.5 0 0 0 0-16z"/></svg>';

  // One shared <audio> element
  var player = new Audio();
  player.preload = 'none';
  var rate = 1;
  var activeBtn = null;
  var clearActive = function () { if (activeBtn) activeBtn.classList.remove('playing'); activeBtn = null; };
  player.addEventListener('ended', clearActive);
  player.addEventListener('pause', clearActive);

  // Play recording N. Returns a promise that resolves to true/false (false = blocked or missing).
  var play = function (n, btn, onError) {
    var src = audioSrc(n);
    if (!src) return Promise.resolve(false);
    try { player.pause(); } catch (e) { /* ignore */ }
    clearActive();
    player.src = src;
    player.playbackRate = rate;
    if ('preservesPitch' in player) player.preservesPitch = true;
    if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;
    if (btn) { activeBtn = btn; btn.classList.add('playing'); }
    var p = player.play();
    if (p && p.then) {
      return p.then(function () { return true; }).catch(function () {
        clearActive();
        if (onError) onError();
        return false;
      });
    }
    return Promise.resolve(true);
  };
  var setRate = function (r) { rate = r; player.playbackRate = r; };
  var stop = function () { try { player.pause(); } catch (e) { /* ignore */ } clearActive(); };

  var miniPlay = function (n, label) {
    return '<button class="mini-play" type="button" data-audio="' + n + '" aria-label="' + esc(label || 'Play audio') + '">' + SPEAKER + '</button>';
  };
  // Any element with data-audio plays that recording (event delegation)
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-audio]');
    if (!b) return;
    e.stopPropagation();
    play(Number(b.getAttribute('data-audio')), b);
  }, true);

  window.SJ = { $: $, esc: esc, shuffle: shuffle, jr: jr, play: play, setRate: setRate, stop: stop, miniPlay: miniPlay, SPEAKER: SPEAKER, audioSrc: audioSrc };
})();
