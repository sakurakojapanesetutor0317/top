/* =========================================================================
   Audio
   1. Recorded audio (best): put the path in the Sheet's Audio column, e.g.
      audio/C001.mp3, and the MP3 in audio/. It is used whenever it exists.
   2. Otherwise the device's Japanese computer voice (speech synthesis) reads
      the kana. The play button only appears when such a voice is installed
      (most phones and Windows/macOS have one; some Android/Linux browsers don't).
   RVRAudio.duration(phrase) gives the clip length for a future Listening Mode.
   ========================================================================= */
window.RVRAudio = (function () {
  'use strict';
  var current = null, currentBtn = null, jaVoice = null, listeners = [];
  var synth = window.speechSynthesis || null;
  var RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

  function findVoice() {
    if (!synth) return;
    var voices = synth.getVoices() || [], best = null;
    voices.forEach(function (v) {
      if (!/^ja(-|_|$)/i.test(v.lang)) return;
      if (!best || (!best.localService && v.localService)) best = v;
    });
    var had = !!jaVoice;
    jaVoice = best;
    if (!had && jaVoice) listeners.forEach(function (fn) { fn(); });
  }
  if (synth) {
    findVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', findVoice);
    else synth.onvoiceschanged = findVoice;
  }

  // Kana for the voice: particles は/へ at the end of a word are read wa/e.
  function speechText(ja) {
    return String(ja).replace(RUBY, '$1').split(/(\s+)/).map(function (w) {
      return w.replace(/(.)は([、。？！?!]*)$/, '$1わ$2').replace(/(.)へ([、。？！?!]*)$/, '$1え$2');
    }).join('');
  }

  function canPlay(p) { return !!(p && (p.audio || jaVoice)); }

  function stop() {
    if (current && current.pause) { try { current.pause(); } catch (e) {} }
    if (synth) { try { synth.cancel(); } catch (e) {} }
    if (currentBtn) currentBtn.classList.remove('playing');
    current = null; currentBtn = null;
  }

  function speak(p, btn) {
    if (!jaVoice) return Promise.resolve(false);
    stop();
    return new Promise(function (resolve) {
      var u = new SpeechSynthesisUtterance(speechText(p.japanese));
      u.lang = 'ja-JP'; u.voice = jaVoice; u.rate = 0.85;
      current = { pause: function () {} }; currentBtn = btn || null;
      if (btn) btn.classList.add('playing');
      u.onend = u.onerror = function () { if (currentBtn === btn) stop(); resolve(true); };
      synth.speak(u);
    });
  }

  function play(phrase, btn) {
    if (!phrase) return Promise.resolve(false);
    if (!phrase.audio) return speak(phrase, btn);
    stop();
    var a = new Audio(phrase.audio);
    current = a; currentBtn = btn || null;
    if (btn) btn.classList.add('playing');
    a.addEventListener('ended', stop);
    a.addEventListener('error', function () { stop(); speak(phrase, btn); });   // missing file → computer voice
    return a.play().then(function () { return true; }).catch(function () { stop(); return speak(phrase, btn); });
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

  return {
    play: play, stop: stop, duration: duration, canPlay: canPlay, speechText: speechText,
    usesVoice: function (p) { return !!(p && !p.audio && jaVoice); },
    onReady: function (fn) { listeners.push(fn); }
  };
})();
