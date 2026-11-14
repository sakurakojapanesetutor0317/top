/* Sakura Japanese Practice — Speaking mode.
   10 random phrases from the 20 recordings. Listen to the model → record your voice → compare.
   Recording uses the browser's own MediaRecorder. The recording stays in this browser tab
   (it is never uploaded) and is thrown away when you go to the next phrase.
   If recording is not possible (no support / permission blocked), the model audio still works. */
(function () {
  'use strict';
  var $ = SJ.$, esc = SJ.esc, PH = window.PH;
  var PER_PLAY = 10, MAX_SEC = 8;

  var list = [], idx = 0, recordedCount = 0, recordedThis = false, bound = false;
  var recorder = null, stream = null, chunks = [], myUrl = null, timer = null, startedAt = 0;
  var myAudio = new Audio();

  var canRecord = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  var MSG = {
    info: 'Recording uses your microphone. The first time, your browser will ask for permission — please choose “Allow”. Your voice stays on this device and is not uploaded.',
    unsupported: 'Recording is not available in this browser. You can still listen to the model and repeat it out loud.',
    denied: 'The microphone is blocked, so recording is off. You can allow it in your browser’s site settings. You can still listen to the model and repeat it out loud.'
  };
  function note(kind) {
    var n = $('sp-note');
    n.className = 'mic-note' + (kind === 'info' ? '' : ' warn');
    n.textContent = MSG[kind];
  }

  function setRecUI(state) {
    // state: idle | recording | done | off
    var rec = $('sp-rec'), mine = $('sp-mine');
    rec.classList.toggle('recording', state === 'recording');
    rec.disabled = state === 'off';
    $('sp-reclabel').textContent = state === 'recording' ? 'Stop' : (state === 'done' ? 'Record again' : 'Record');
    mine.disabled = state !== 'done';
    $('sp-status').textContent = state === 'recording' ? 'Recording… speak now' : (state === 'done' ? 'Now compare: Model ↔ My voice' : '');
  }

  function dropRecording() {
    try { myAudio.pause(); } catch (e) { /* ignore */ }
    $('sp-mine').classList.remove('playing');
    if (myUrl) { URL.revokeObjectURL(myUrl); myUrl = null; }
  }
  function releaseMic() {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  }
  // discard = true when leaving the phrase: the unfinished recording is thrown away
  function stopRecording(discard) {
    clearInterval(timer); timer = null;
    if (recorder && recorder.state === 'recording') {
      if (discard) { recorder.ondataavailable = null; recorder.onstop = releaseMic; }
      recorder.stop();
    }
  }

  function startRecording() {
    SJ.stop(); dropRecording();
    $('sp-rec').disabled = true;  // until the microphone answers
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s; chunks = [];
      try { recorder = new MediaRecorder(s); } catch (e) { releaseMic(); note('unsupported'); setRecUI('off'); return; }
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = function () {
        releaseMic();
        if (!chunks.length) { setRecUI('idle'); return; }
        myUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        myAudio.src = myUrl;
        if (!recordedThis) { recordedThis = true; recordedCount++; }
        setRecUI('done');
      };
      recorder.start();
      startedAt = Date.now();
      setRecUI('recording');
      timer = setInterval(function () {
        var sec = Math.floor((Date.now() - startedAt) / 1000);
        $('sp-status').textContent = 'Recording… ' + sec + 's (tap Stop when you finish)';
        if (sec >= MAX_SEC) stopRecording(false);
      }, 250);
    }).catch(function (err) {
      releaseMic();
      var blocked = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      note(blocked ? 'denied' : 'unsupported');
      setRecUI('off');
    });
  }

  function render() {
    var p = PH[list[idx]];
    stopRecording(true); releaseMic(); dropRecording(); recordedThis = false;
    $('sp-count').textContent = (idx + 1) + ' / ' + list.length;
    $('sp-fill').style.width = ((idx + 1) / list.length * 100) + '%';
    var cover = p.img && /scenes\//.test(p.img);
    $('sp-phrase').innerHTML = (p.img ? '<span class="art"><img src="' + esc(p.img) + '" alt="" class="' + (cover ? 'cover' : '') + '"></span>' : '') +
      SJ.jr(p.jp, p.ro, p.en);
    $('sp-next').textContent = idx === list.length - 1 ? 'Finish' : 'Next';
    setRecUI(canRecord && !$('sp-note').classList.contains('warn') ? 'idle' : 'off');
    SJ.play(p.audio, $('sp-model'));
  }

  function finish() {
    stopRecording(true); releaseMic(); dropRecording(); SJ.stop();
    $('sp-play').classList.add('hidden');
    $('sp-result').classList.remove('hidden');
    $('sp-total').textContent = list.length;
    $('sp-cheer').textContent = canRecord && recordedCount
      ? 'You recorded ' + recordedCount + ' of ' + list.length + ' phrases. よくできました！'
      : 'You practiced ' + list.length + ' phrases. よくできました！';
    $('sp-review').innerHTML = list.map(function (id) {
      var p = PH[id];
      return '<div class="reviewrow">' + SJ.jr(p.jp, p.ro, p.en, 'left') + SJ.miniPlay(p.audio) + '</div>';
    }).join('');
    window.scrollTo(0, 0);
  }

  function bind() {
    if (bound) return; bound = true;
    $('sp-model').addEventListener('click', function () {
      try { myAudio.pause(); } catch (e) { /* ignore */ }
      SJ.play(PH[list[idx]].audio, $('sp-model'));
    });
    $('sp-rec').addEventListener('click', function () {
      if (recorder && recorder.state === 'recording') stopRecording(false); else startRecording();
    });
    $('sp-mine').addEventListener('click', function () {
      if (!myUrl) return;
      SJ.stop();
      myAudio.currentTime = 0;
      $('sp-mine').classList.add('playing');
      var pr = myAudio.play(); if (pr && pr.catch) pr.catch(function () { $('sp-mine').classList.remove('playing'); });
    });
    myAudio.addEventListener('ended', function () { $('sp-mine').classList.remove('playing'); });
    $('sp-next').addEventListener('click', function () {
      if (idx === list.length - 1) { finish(); return; }
      idx++; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('sp-again').addEventListener('click', function () { start(); });
  }

  function start() {
    bind();
    note(canRecord ? 'info' : 'unsupported');
    var withAudio = window.PHRASES.filter(function (p) { return p.audio; }).map(function (p) { return p.id; });
    list = SJ.shuffle(withAudio).slice(0, PER_PLAY);
    idx = 0; recordedCount = 0;
    $('sp-result').classList.add('hidden');
    $('sp-play').classList.remove('hidden');
    render();
  }

  function leave() { stopRecording(true); releaseMic(); dropRecording(); }

  window.SpeakingMode = { start: start, leave: leave };
})();
