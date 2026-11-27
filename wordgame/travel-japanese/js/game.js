/* =========================================================================
   Vocabulary Rush — game engine (one lane, four choices).
   All timing (countdown, falling, feedback pauses, game clock) runs inside a
   single requestAnimationFrame loop, so pausing freezes everything at once and
   ending the game leaves no timers behind.
   ========================================================================= */
window.RVRGame = (function () {
  'use strict';

  var PUNCT = /[\s。、？！?!・「」『』（）()〜ー…,.]/g;
  var RUBY = /\{([^|{}]+)\|([^|{}]+)\}/g;

  function plain(s) { return String(s || '').replace(RUBY, '$2'); }      // {予約|よやく} → よやく
  function kanaCount(s) { return plain(s).replace(PUNCT, '').length; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function create(o) {
    var C = o.config, P = o.progress, els = o.els, shuffle = o.shuffle;
    var diff = C.difficulties[o.difficulty] || C.difficulties.normal;
    var mode = o.mode || C.mode;
    var ids = o.phrases.map(function (p) { return p.id; });
    var byId = {}; o.scope.concat(o.phrases, o.fallback || []).forEach(function (p) { byId[p.id] = p; });
    var totalMs = C.durationSec * 1000;

    var S = {
      phase: 'idle', paused: false, raf: 0, last: 0,
      elapsed: 0, countdownMs: 0, feedbackMs: 0, shownSec: -1,
      score: 0, combo: 0, bestCombo: 0, correct: 0, wrong: 0, timeouts: 0, qCount: 0,
      cur: null, recent: [], retry: [], sess: {}, newlyMastered: [], missed: {},
      laneH: 0, cardH: 0
    };
    ids.forEach(function (id) { S.sess[id] = { seen: 0, correct: 0, wrong: 0 }; });

    /* ---------------- loop ---------------- */
    function frame(t) {
      S.raf = requestAnimationFrame(frame);
      if (!S.last) { S.last = t; return; }
      var dt = Math.min(t - S.last, 100);   // a long frame (tab switch, slow phone) never jumps the clock
      S.last = t;
      if (S.paused) return;

      if (S.phase === 'countdown') {
        S.countdownMs -= dt;
        var n = Math.ceil(S.countdownMs / (C.countdownMs / 3));
        if (els.count.dataset.n !== String(n)) { els.count.dataset.n = n; els.count.textContent = n > 0 ? n : ''; bump(els.count); }
        if (S.countdownMs <= 0) { els.count.classList.add('hidden'); nextQuestion(); }
        return;
      }

      S.elapsed += dt;
      var remain = totalMs - S.elapsed;
      drawTimer(remain);
      if (remain <= 0) { end(); return; }

      if (S.phase === 'falling') {
        S.cur.progress += dt / S.cur.duration;
        if (S.cur.progress >= 1) { S.cur.progress = 1; drawCard(); timeout(); return; }
        drawCard();
      } else if (S.phase === 'feedback') {
        S.feedbackMs -= dt;
        if (S.feedbackMs <= 0) nextQuestion();
      }
    }

    function startLoop() { cancelAnimationFrame(S.raf); S.last = 0; S.raf = requestAnimationFrame(frame); }

    /* ---------------- choosing the next phrase ---------------- */
    function pickId() {
      var lastId = S.recent[S.recent.length - 1];
      for (var i = 0; i < S.retry.length; i++) {
        if (S.retry[i].due <= S.qCount && S.retry[i].id !== lastId) return S.retry.splice(i, 1)[0].id;
      }
      var avoid = S.recent.slice(-Math.min(2, ids.length - 1));
      var cands = ids.filter(function (id) { return avoid.indexOf(id) < 0; });
      if (!cands.length) cands = ids.slice();
      var weights = cands.map(function (id) {
        var s = S.sess[id], r = P.get(id);
        var w = r.mastered ? 0.6 : 2;
        if (s.seen === 0) w += 3;            // make sure every phrase appears early
        w += s.wrong * 1.5;                  // phrases missed in this game come back more often
        w -= Math.min(r.streak, C.masteryStreak) * 0.4;
        return Math.max(w, 0.3);
      });
      var sum = weights.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum;
      for (var k = 0; k < cands.length; k++) { x -= weights[k]; if (x <= 0) break; }
      var id = cands[Math.min(k, cands.length - 1)];
      S.retry = S.retry.filter(function (r) { return r.id !== id; });
      return id;
    }

    /* ---- choices: from the chosen practice scope only, never two meanings that could both look right ---- */
    var confusable = {};
    (o.confusableGroups || []).forEach(function (g) {
      g.forEach(function (a) { g.forEach(function (b) { if (a !== b) confusable[a + '|' + b] = true; }); });
    });
    var STOP = {};
    ('please the a an i you we my your this these that is it its do does can could may would will to of for be ' +
     'have has some any me us our here there are am at in on with get just one').split(' ').forEach(function (w) { STOP[w] = 1; });
    var tokCache = {};
    function tokens(s) {
      if (tokCache[s]) return tokCache[s];
      var out = {};
      (s.toLowerCase().replace(/\u2019/g, "'").match(/[a-z0-9']+/g) || []).forEach(function (x) {
        if (/n't$/.test(x)) { out.not = 1; x = x.slice(0, -3); }
        x = x.replace(/'(s|ll|d|re|m)$/, '');
        if (x.length < 2 || STOP[x]) return;
        if (x.length > 3 && /s$/.test(x) && !/ss$/.test(x)) x = x.slice(0, -1);
        out[x] = 1;
      });
      return (tokCache[s] = Object.keys(out));
    }
    // Same rules as tools/build_data.py (similar_english / similar_japanese) — keep them in step.
    // "Receipt" / "A receipt, please." or "Hot (drink)" / "Hot, please." → too close to share a question
    function similarEnglish(a, b) {
      if (a.toLowerCase() === b.toLowerCase()) return true;
      var A = tokens(a), B = tokens(b);
      if (!A.length || !B.length) return false;
      var inter = A.filter(function (x) { return B.indexOf(x) >= 0; }).length;
      if (inter / (A.length + B.length - inter) >= 0.75) return true;
      return (inter === A.length || inter === B.length) && Math.min(A.length, B.length) <= 2;
    }
    function jnorm(s) { return plain(s).replace(/[\s。、？！?!・「」（）()〜…,.]/g, ''); }
    // ホット / ホットで。 → one contains the other
    function similarJapanese(a, b) {
      a = jnorm(a); b = jnorm(b);
      if (a === b) return true;
      var sh = a.length <= b.length ? a : b, lo = sh === a ? b : a;
      return sh.length >= 2 && lo.indexOf(sh) >= 0;
    }
    function sameTag(x, y) {
      var a = x.cg || [], b = y.cg || [];
      for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) >= 0) return true;
      return false;
    }
    function clash(x, y) {
      return confusable[x.id + '|' + y.id] || sameTag(x, y) || similarEnglish(x.english, y.english) ||
        similarJapanese(x.japanese, y.japanese) ||
        (x.avoid || []).indexOf(y.id) >= 0 || (y.avoid || []).indexOf(x.id) >= 0;
    }

    function buildOptions(p) {
      var sameKind = function (q) { return q.type === p.type; };
      var session = shuffle(ids.filter(function (id) { return id !== p.id; }).map(function (id) { return byId[id]; }));
      var scope = shuffle(o.scope.filter(function (q) { return ids.indexOf(q.id) < 0; }));
      // order of preference: same kind (word ↔ word, phrase ↔ phrase) in this game, then in this scene
      var tiers = [session.filter(sameKind), scope.filter(sameKind), session.filter(function (q) { return !sameKind(q); }),
                   scope.filter(function (q) { return !sameKind(q); })];
      var out = [];
      tiers.forEach(function (list) {
        list.forEach(function (q) {
          if (out.length >= 3 || clash(p, q)) return;
          for (var i = 0; i < out.length; i++) if (clash(out[i], q)) return;
          out.push(q);
        });
      });
      // only if this scope is too small: other items of the same situation
      shuffle(o.fallback || []).forEach(function (q) {
        if (out.length >= 3 || q.id === p.id || clash(p, q)) return;
        for (var i = 0; i < out.length; i++) if (clash(out[i], q)) return;
        out.push(q);
      });
      var opts = shuffle(out.concat([p]));
      return { opts: opts, answer: opts.indexOf(p) };
    }

    // Text Mode: reading time grows with length. Listening Mode: audio length + answer window.
    function fallDuration(p, firstSeen) {
      var ms;
      if (mode === 'listening') {
        ms = (p.audioMs || C.listening.fallbackAudioMs) + C.listening.answerWindowMs;
      } else {
        ms = clamp(C.fall.baseMs + kanaCount(p.japanese) * C.fall.perCharMs, C.fall.minMs, C.fall.maxMs);
      }
      if (firstSeen) ms *= C.fall.firstSeenBonus;
      var ramp = 1 + (C.fall.rampEnd - 1) * Math.min(1, S.elapsed / totalMs);
      return ms * ramp / diff.speed;
    }

    /* ---------------- question flow ---------------- */
    function nextQuestion() {
      var id = pickId(), p = byId[id], s = S.sess[id];
      var built = buildOptions(p);
      S.qCount++;
      S.recent.push(id); if (S.recent.length > 4) S.recent.shift();
      S.cur = { id: id, p: p, opts: built.opts, answer: built.answer, progress: 0, duration: fallDuration(p, s.seen === 0) };
      s.seen++;

      els.pops.innerHTML = '';             // clear the previous phrase's "+points" so it never covers the new card
      presentPrompt(p);
      els.buttons.forEach(function (b, i) {
        b.classList.remove('is-correct', 'is-wrong', 'is-dim');
        b.disabled = !built.opts[i];
        b.classList.toggle('is-empty', !built.opts[i]);
        b.querySelector('.txt').textContent = built.opts[i] ? built.opts[i].english : '';
      });
      els.answers.classList.remove('locked');
      els.card.className = 'fall-card enter';
      void els.card.offsetWidth;            // restart the drop-in animation
      measure();
      drawCard();
      S.phase = 'falling';
    }

    function presentPrompt(p) {
      els.who.textContent = p.group === 'vocabulary' ? 'Word' : p.group === 'staff' ? 'Staff says' : 'You say';
      els.who.className = 'who ' + p.group;
      els.reveal.textContent = '';
      els.romaji.textContent = p.romaji || '';
      els.romaji.classList.toggle('hidden', !o.showRomaji);
      if (mode === 'listening') {
        // Prepared for later: the phrase is heard, not read.
        els.jp.textContent = '♪';
        if (o.playAudio) o.playAudio(p);
      } else {
        if (o.jpHTML) els.jp.innerHTML = o.jpHTML(p.japanese); else els.jp.textContent = plain(p.japanese);
      }
      drawDots(P.get(p.id));
    }

    function drawDots(r) {
      var html = '';
      for (var i = 0; i < C.masteryStreak; i++) html += '<i class="' + (r.mastered || i < r.streak ? 'on' : '') + '"></i>';
      els.dots.innerHTML = html;
      els.dots.title = r.mastered ? 'Mastered' : r.streak + ' / ' + C.masteryStreak + ' in a row';
    }

    function answer(i) {
      if (S.paused || S.phase !== 'falling' || i < 0 || i > 3) return;   // locks out double taps and late taps
      S.phase = 'feedback';
      els.answers.classList.add('locked');
      var ok = i === S.cur.answer;
      if (ok) onCorrect(i); else onWrong(i);
    }

    function comboMult(c) {
      var x = 1;
      C.scoring.comboSteps.forEach(function (s) { if (c >= s.at) x = s.x; });
      return x;
    }

    function onCorrect(i) {
      var id = S.cur.id, res = P.record(id, true);
      S.sess[id].correct++; S.correct++;
      S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo);
      var mult = comboMult(S.combo);
      var pts = Math.round((C.scoring.base + C.scoring.speedBonus * (1 - S.cur.progress)) * mult / 10) * 10;
      S.score += pts;
      els.buttons[i].classList.add('is-correct');
      els.card.classList.add('ok');
      drawDots(res.record);
      pop('+' + pts, 'pts');
      if (res.justMastered) { S.newlyMastered.push(id); pop('Mastered! ✿', 'mastered'); }
      drawHud(true);
      S.feedbackMs = C.feedbackMs.correct + (res.justMastered ? 350 : 0);
    }

    function onWrong(i) {
      miss();
      els.buttons[i].classList.remove('is-dim');
      els.buttons[i].classList.add('is-wrong');
      S.wrong++;
      S.feedbackMs = C.feedbackMs.wrong;
    }

    function timeout() {
      S.phase = 'feedback';
      els.answers.classList.add('locked');
      miss();
      S.timeouts++;
      els.card.classList.add('late');
      pop("Time's up", 'late');
      S.feedbackMs = C.feedbackMs.timeout;
    }

    function miss() {
      var id = S.cur.id, res = P.record(id, false);
      S.sess[id].wrong++;
      S.missed[id] = (S.missed[id] || 0) + 1;
      var mi = S.newlyMastered.indexOf(id); if (mi >= 0) S.newlyMastered.splice(mi, 1);
      S.combo = 0;
      S.retry = S.retry.filter(function (r) { return r.id !== id; });
      S.retry.push({ id: id, due: S.qCount + C.retryGap });
      els.buttons.forEach(function (b, k) {
        if (k === S.cur.answer) b.classList.add('is-correct'); else b.classList.add('is-dim');
      });
      els.card.classList.add('ng');
      els.reveal.textContent = S.cur.p.english;  // show the answer so the miss becomes a mini lesson
      els.romaji.classList.remove('hidden');       // …with the romaji to help reading next time
      drawDots(res.record);
      drawHud(false);
    }

    /* ---------------- drawing ---------------- */
    function measure() {
      S.laneH = els.lane.clientHeight;
      S.cardH = els.card.offsetHeight;
    }

    function drawCard() {
      if (!S.cur) return;
      var top = 10, bottom = S.laneH - S.cardH - 14;
      var y = top + Math.max(0, bottom - top) * S.cur.progress;
      els.card.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      els.card.classList.toggle('near', S.cur.progress > 0.72 && S.phase === 'falling');
    }

    function drawTimer(remain) {
      var sec = Math.max(0, Math.ceil(remain / 1000));
      els.timeFill.style.transform = 'scaleX(' + Math.max(0, remain / totalMs).toFixed(4) + ')';
      if (sec === S.shownSec) return;
      S.shownSec = sec;
      els.time.textContent = Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
      els.timeBox.classList.toggle('low', sec <= 15);
    }

    function drawHud(bumpIt) {
      els.score.textContent = S.score.toLocaleString('en-US');
      els.combo.textContent = S.combo;
      els.mult.textContent = '×' + comboMult(S.combo);
      els.comboBox.classList.toggle('hot', comboMult(S.combo) > 1);
      els.mastered.textContent = masteredCount() + '/' + ids.length;
      if (bumpIt) { bump(els.score); if (S.combo > 1) bump(els.combo); }
    }

    function masteredCount() { return ids.filter(function (id) { return P.get(id).mastered; }).length; }

    function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

    function pop(text, kind) {
      var d = document.createElement('div');
      d.className = 'pop ' + kind;
      d.textContent = text;
      var y = parseFloat((els.card.style.transform.match(/,([\d.]+)px/) || [0, 40])[1]);
      d.style.top = Math.max(4, y - 6) + 'px';
      d.addEventListener('animationend', function () { d.remove(); });
      els.pops.appendChild(d);
    }

    /* ---------------- lifecycle ---------------- */
    function onResize() { measure(); drawCard(); }

    function start() {
      S.phase = 'countdown';
      S.countdownMs = C.countdownMs;
      els.count.classList.remove('hidden');
      els.count.dataset.n = '';
      els.card.className = 'fall-card hidden-card';
      els.jp.textContent = ''; els.reveal.textContent = ''; els.who.textContent = ''; els.romaji.textContent = ''; els.dots.innerHTML = '';
      els.pops.innerHTML = '';
      els.buttons.forEach(function (b) { b.disabled = true; b.className = 'ans'; b.querySelector('.txt').textContent = ''; });
      els.answers.classList.add('locked');
      drawTimer(totalMs);
      drawHud(false);
      window.addEventListener('resize', onResize);
      startLoop();
    }

    function pause() {
      if (S.paused || S.phase === 'ended' || S.phase === 'idle') return false;
      S.paused = true;
      cancelAnimationFrame(S.raf);
      return true;
    }

    function resume() {
      if (!S.paused || S.phase === 'ended') return;
      S.paused = false;
      measure();
      startLoop();
    }

    function stop() {
      S.phase = 'ended';
      cancelAnimationFrame(S.raf);
      window.removeEventListener('resize', onResize);
      els.pops.innerHTML = '';
      els.answers.classList.add('locked');
    }

    function end() {
      if (S.phase === 'ended') return;
      // an answer still on screen when time runs out is simply dropped (not counted)
      stop();
      if (o.onEnd) o.onEnd(results());
    }

    function results() {
      var answered = S.correct + S.wrong + S.timeouts;
      var missedIds = Object.keys(S.missed).sort(function (a, b) { return S.missed[b] - S.missed[a]; });
      return {
        score: S.score,
        correct: S.correct, wrong: S.wrong, timeouts: S.timeouts, answered: answered,
        accuracy: answered ? Math.round(S.correct / answered * 100) : 0,
        bestCombo: S.bestCombo,
        newlyMastered: S.newlyMastered.slice(),
        masteredInSet: ids.filter(function (id) { return P.get(id).mastered; }),
        missed: missedIds.map(function (id) { return { id: id, times: S.missed[id] }; }),
        session: S.sess,
        ids: ids.slice()
      };
    }

    return {
      start: start,
      answer: answer,
      pause: pause,
      resume: resume,
      finishNow: end,          // "End game" from the pause menu
      destroy: stop,           // leave without results
      isPaused: function () { return S.paused; },
      isActive: function () { return S.phase !== 'ended' && S.phase !== 'idle'; },
      _state: S,               // for testing in the console
      _options: buildOptions,  // (testing) the four choices for an item
      _clash: clash
    };
  }

  return { create: create, kanaCount: kanaCount, plain: plain };
})();
