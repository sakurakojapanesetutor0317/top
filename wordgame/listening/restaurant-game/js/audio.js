/* =========================================================================
   Audio helper (ready for MP3 files later).
   Phrases with audio: null simply show no play button, so nothing breaks today.
   When files are added (e.g. audio: "audio/restaurant_001.mp3"):
     - Study Mode and the phrase check screen show a play button automatically
     - RVRAudio.duration(phrase) gives the clip length for Listening Mode timing
   ========================================================================= */
window.RVRAudio = (function () {
  'use strict';
  var current = null, currentBtn = null;

  function stop() {
    if (current) { try { current.pause(); } catch (e) {} }
    if (currentBtn) currentBtn.classList.remove('playing');
    current = null; currentBtn = null;
  }

  function play(phrase, btn) {
    if (!phrase || !phrase.audio) return Promise.resolve(false);
    stop();
    var a = new Audio(phrase.audio);
    current = a; currentBtn = btn || null;
    if (btn) btn.classList.add('playing');
    a.addEventListener('ended', stop);
    a.addEventListener('error', stop);
    return a.play().then(function () { return true; }).catch(function () { stop(); return false; });
  }

  // Loads metadata once and stores the length (ms) on the phrase as phrase.audioMs.
  function duration(phrase) {
    if (!phrase || !phrase.audio) return Promise.resolve(null);
    if (phrase.audioMs) return Promise.resolve(phrase.audioMs);
    return new Promise(function (resolve) {
      var a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () { phrase.audioMs = Math.round(a.duration * 1000); resolve(phrase.audioMs); });
      a.addEventListener('error', function () { resolve(null); });
      a.src = phrase.audio;
    });
  }

  return { play: play, stop: stop, duration: duration };
})();
