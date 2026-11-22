/* =========================================================================
   Restaurant Vocabulary Rush — screens and navigation
   Flow: #home (choose a scene) → #scene/<Scene> (study + culture tips)
         → #practice/<Scene> (choose what to practise, check the set) → #game → #results
   Also: #progress
   ========================================================================= */
(function () {
  'use strict';
  var C = window.RVR_CONFIG, P = window.RVRProgress, Session = window.RVRSession, Audio = window.RVRAudio;
  var DATA = window.RVR_DATA, ITEMS = DATA.items, SCENES = DATA.scenes, TIPS = DATA.tips;
  var CONFUSABLE = window.RVR_CONFUSABLE_GROUPS || [];
  var byId = {}; ITEMS.forEach(function (p) { byId[p.id] = p; });
  var sceneByKey = {}; SCENES.forEach(function (s) { sceneByKey[s.key] = s; });
  var KINDS = [
    { key: 'vocabulary', label: 'Vocabulary', short: 'Words' },
    { key: 'customer', label: 'Customer', short: 'You say' },
    { key: 'staff', label: 'Staff', short: 'Staff say' }
  ];
  var SETS = [
    { key: 'normal', label: 'New & learning' },
    { key: 'mistakes', label: 'To review' },
    { key: 'mastered', label: 'Mastered' }
  ];

  var savedKinds = P.setting('kinds');
  var app = {
    scene: null,
    tab: 'vocabulary',
    query: '',
    kinds: [savedKinds && savedKinds.length ? savedKinds[0] : 'vocabulary'],
    set: 'normal',
    romaji: P.setting('romaji') === true,
    difficulty: C.difficulties[P.setting('difficulty')] ? P.setting('difficulty') : C.defaultDifficulty,
    session: null,
    pendingStart: false,
    game: null,
    lastResult: null
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(name, cls) { return '<svg class="i ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }
  function sceneIcon(key) { return '<svg class="i" aria-hidden="true"><use href="#sc-' + key.replace(/\s+/g, '') + '"/></svg>'; }
  function sceneItems(key) { return ITEMS.filter(function (p) { return p.scene === key; }); }

  var toastTimer = 0;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, ms || 2600);
  }

  /* ---------------- shared pieces ---------------- */
  function counts(list) {
    var c = { mastered: 0, learning: 0, new: 0, review: 0 };
    list.forEach(function (p) { c[P.status(p.id)]++; if (P.needsReview(p.id)) c.review++; });
    return c;
  }
  function stackHTML(list) {
    var c = counts(list), n = list.length || 1;
    return '<div class="stack" role="img" aria-label="' + c.mastered + ' mastered, ' + c.learning + ' learning, ' + c.new + ' new">' +
      '<i class="m" style="width:' + (c.mastered / n * 100) + '%"></i><i class="l" style="width:' + (c.learning / n * 100) + '%"></i></div>';
  }
  function dotsHTML(r) {
    var h = '<span class="dots" aria-hidden="true">';
    for (var i = 0; i < C.masteryStreak; i++) h += '<i class="' + (r.mastered || i < r.streak ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  function statusHTML(p) {
    var st = P.status(p.id), r = P.get(p.id);
    if (st === 'mastered') return '<span class="status-pill mastered"><span class="badge">' + icon('check') + '</span>Mastered</span>';
    if (st === 'learning') return '<span class="status-pill learning">' + dotsHTML(r) + 'Learning<br>' + r.streak + '/' + C.masteryStreak + '</span>';
    return '<span class="status-pill new">' + dotsHTML(r) + 'Not yet<br>practised</span>';
  }
  function kindTag(p) {
    var k = { vocabulary: 'Word', customer: 'Customer says', staff: 'Staff says' }[p.group];
    return '<span class="tag ' + p.group + '">' + k + '</span>';
  }

  function rowHTML(p, opt) {
    opt = opt || {};
    var st = P.status(p.id);
    var meta = opt.noMeta ? '' : '<span class="pmeta">' + (opt.noKind ? '' : kindTag(p)) +
      (opt.markNew && st === 'new' ? '<span class="tag new">New</span>' : '') +
      (opt.markReview && P.needsReview(p.id) ? '<span class="tag rv">To review</span>' : '') +
      (opt.showScene ? '<span class="tag">' + esc(p.scene) + '</span>' : '') + '</span>';
    var play = p.audio ? '<button class="mini-play" type="button" data-audio="' + esc(p.id) + '" aria-label="Listen">' + icon('speaker') + '</button>' : '';
    var right = opt.times ? '<span class="times">missed ×' + opt.times + '</span>' : statusHTML(p);
    return '<div class="prow">' + play + '<div class="pm">' +
      '<span class="pj" lang="ja">' + esc(p.japanese) + '</span>' +
      '<span class="pr">' + esc(p.romaji) + '</span>' +
      '<span class="pe">' + esc(p.english) + '</span>' + meta + '</div>' + right + '</div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-audio]');
    if (b) Audio.play(byId[b.getAttribute('data-audio')], b);
  });

  /* ---------------- navigation ---------------- */
  var VIEWS = ['home', 'scene', 'preview', 'results', 'progress'];

  function go(hash, replace) {
    var h = '#' + hash;
    if (location.hash === h || decodeURIComponent(location.hash) === h) { route(); return; }
    if (replace) location.replace(h); else location.hash = h;
  }
  function sceneHash(view, key) { return view + '/' + encodeURIComponent(key); }

  function show(name) {
    VIEWS.forEach(function (v) { $('view-' + v).classList.toggle('hidden', v !== name); });
    window.scrollTo(0, 0);
  }

  function route() {
    var parts = location.hash.slice(1).split('/');
    var name = parts[0] || 'home', key = parts[1] ? decodeURIComponent(parts[1]) : null;
    Audio.stop();
    if (name !== 'game' && app.game) leaveGame();

    if (name === 'game') {
      if (app.pendingStart && app.session && app.session.phrases.length) { app.pendingStart = false; startGame(); return; }
      go(app.scene ? sceneHash('practice', app.scene) : 'home', true); return;
    }
    if ((name === 'scene' || name === 'practice') && !sceneByKey[key]) { go('home', true); return; }
    if (name === 'results' && !app.lastResult) { go('home', true); return; }

    if (name === 'scene') {
      if (app.scene !== key) { app.scene = key; app.tab = 'vocabulary'; app.query = ''; }
      show('scene'); renderScene(); return;
    }
    if (name === 'practice') {
      if (app.scene !== key) { app.scene = key; app.session = null; }
      show('preview'); renderPractice(); return;
    }
    if (name === 'home') { show('home'); renderHome(); return; }
    if (name === 'results') { show('results'); renderResults(); return; }
    if (name === 'progress') { show('progress'); renderProgress(); return; }
    go('home', true);
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b) { go(b.getAttribute('data-go')); return; }
    b = e.target.closest('[data-scene]');
    if (b) go(sceneHash('scene', b.getAttribute('data-scene')));
  });

  /* ---------------- home: choose a scene ---------------- */
  function renderHome() {
    var c = counts(ITEMS), pct = Math.round(c.mastered / ITEMS.length * 100);
    $('home-progress').innerHTML = '<span class="mini-track"><i style="width:' + pct + '%"></i></span><span><b>' + c.mastered + '</b> / ' + ITEMS.length + ' mastered</span>';
    $('scene-grid').innerHTML = SCENES.map(function (s, i) {
      var list = sceneItems(s.key), sc = counts(list);
      return '<button class="scene-card" type="button" data-scene="' + esc(s.key) + '">' +
        '<span class="sc-top"><span class="sc-ic">' + sceneIcon(s.key) + '</span><span class="sc-no">' + ('0' + (i + 1)).slice(-2) + '</span></span>' +
        '<b>' + esc(s.key) + '</b><span class="sc-ja" lang="ja">' + esc(s.ja) + '</span>' + stackHTML(list) +
        '<span class="sc-meta"><span>' + sc.mastered + '/' + list.length + ' mastered</span>' +
        (sc.review ? '<span class="rv">' + sc.review + ' to review</span>' : '') + '</span></button>';
    }).join('');
  }

  /* ---------------- scene: study ---------------- */
  function kana(s) { return s.replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); }); }
  function norm(s) { return kana(String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')).replace(/[\s。、？！?!.,'’\-]/g, ''); }

  function renderScene() {
    var s = sceneByKey[app.scene], list = sceneItems(s.key), c = counts(list);
    $('sc-title').textContent = s.key;
    $('sc-ja').textContent = s.ja;
    $('sc-sum').innerHTML = '<span><b>' + c.mastered + '</b> / ' + list.length + ' mastered</span>' + stackHTML(list);

    var tips = TIPS.filter(function (t) { return t.scene === s.key; });
    var tipsOpen = P.setting('tipsSeen-' + s.key) !== true;
    $('sc-tips').innerHTML = tips.length ? '<details class="tips"' + (tipsOpen ? ' open' : '') + '><summary>' + icon('bulb') + 'Culture Tips<span class="n">' + tips.length + '</span></summary><div class="tip-list">' +
      tips.map(function (t) {
        return '<div class="tip"><b>' + esc(t.topic) + '</b><p>' + esc(t.text) + '</p>' + (t.url ? '<a href="' + esc(t.url) + '" target="_blank" rel="noopener">Read more</a>' : '') + '</div>';
      }).join('') + '</div></details>' +
      (s.key === 'Problems' ? '<p class="safety">These allergy phrases help you communicate. They are not a guarantee that food is safe — always confirm with staff.</p>' : '')
      : '';
    var det = $('sc-tips').querySelector('details');
    if (det) det.addEventListener('toggle', function () { if (!det.open) P.setting('tipsSeen-' + s.key, true); });

    var tabs = KINDS.map(function (k) { return { key: k.key, label: k.label, n: list.filter(function (p) { return p.group === k.key; }).length }; });
    tabs.push({ key: 'review', label: 'To Review', n: c.review });
    $('sc-tabs').innerHTML = tabs.map(function (t) {
      return '<button type="button" role="tab" data-tab="' + t.key + '" aria-selected="' + (app.tab === t.key) + '" class="' + (t.key === 'review' ? 'rv' : '') + '"><span class="n">' + t.n + '</span>' + esc(t.label) + '</button>';
    }).join('');
    $('sc-search').value = app.query;
    drawSceneList();
  }

  function tabItems() {
    var list = sceneItems(app.scene);
    if (app.tab === 'review') return list.filter(function (p) { return P.needsReview(p.id); });
    return list.filter(function (p) { return p.group === app.tab; });
  }

  function drawSceneList() {
    var q = norm(app.query.trim()), base = tabItems();
    var list = base.filter(function (p) { return !q || norm(p.japanese).indexOf(q) >= 0 || norm(p.romaji).indexOf(q) >= 0 || norm(p.english).indexOf(q) >= 0; });
    var note = '';
    if (app.tab === 'review') {
      note = base.length ? '<p class="tab-note">Items you missed and have not mastered yet. <button class="link-inline" type="button" id="sc-review-play">Practise these →</button></p>'
        : '';
    }
    $('sc-count').innerHTML = (list.length === 1 ? '1 item' : list.length + ' items') + (app.tab === 'customer' ? ' · what you say' : app.tab === 'staff' ? ' · what staff say to you' : '');
    $('sc-list').innerHTML = note + (list.length
      ? list.map(function (p) { return rowHTML(p, { noKind: app.tab !== 'review' }); }).join('')
      : '<div class="empty">' + (app.tab === 'review' && !q ? 'Nothing to review here yet. Items you miss in a game will appear in this list.' : 'No items found. Try another word.') + '</div>');
    var rp = $('sc-review-play');
    if (rp) rp.addEventListener('click', function () { app.set = 'mistakes'; app.session = null; go(sceneHash('practice', app.scene)); });
  }

  $('sc-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    app.tab = b.getAttribute('data-tab');
    this.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    drawSceneList();
  });
  $('sc-search').addEventListener('input', function () { app.query = this.value; drawSceneList(); });
  $('sc-play').addEventListener('click', function () {
    app.session = null;
    app.set = 'normal';
    go(sceneHash('practice', app.scene));
  });

  /* ---------------- practice setup ---------------- */
  function scopePool() {
    return sceneItems(app.scene).filter(function (p) { return app.kinds.indexOf(p.group) >= 0; });
  }
  function setIds(set) {
    return scopePool().filter(function (p) {
      return set === 'mistakes' ? P.needsReview(p.id) : set === 'mastered' ? P.status(p.id) === 'mastered' : true;
    }).map(function (p) { return p.id; });
  }
  function buildSession() {
    var pool = scopePool();
    if (app.set === 'normal') app.session = Session.build('normal', pool);
    else app.session = Session.build('custom', pool, { ids: setIds(app.set), label: app.set });
    app.session.scene = app.scene;
    app.session.kinds = app.kinds.slice();
    app.session.set = app.set;
  }

  function renderPractice() {
    var s = sceneByKey[app.scene], all = sceneItems(app.scene);
    if (app.set !== 'normal' && setIds(app.set).length === 0) app.set = 'normal';
    if (!app.session || app.session.scene !== app.scene) buildSession();
    $('preview-title').textContent = 'Practice';
    $('preview-scene').textContent = s.key + ' · ' + s.ja;

    $('pv-kinds').innerHTML = KINDS.map(function (k) {
      var n = all.filter(function (p) { return p.group === k.key; }).length, on = app.kinds.indexOf(k.key) >= 0;
      return '<button type="button" class="chip toggle' + (on ? ' on' : '') + '" data-kind="' + k.key + '" aria-pressed="' + on + '"' + (n ? '' : ' disabled') + '>' + esc(k.label) + ' <span class="n">' + n + '</span></button>';
    }).join('');
    $('pv-set').innerHTML = SETS.map(function (t) {
      var n = t.key === 'normal' ? scopePool().length : setIds(t.key).length;
      return '<button type="button" role="radio" data-set="' + t.key + '" aria-checked="' + (app.set === t.key) + '"' + (n ? '' : ' disabled') + '>' + esc(t.label) + '<small>' + n + ' items</small></button>';
    }).join('');
    $('speed-seg').innerHTML = Object.keys(C.difficulties).map(function (k) {
      return '<button type="button" role="radio" data-speed="' + k + '" aria-checked="' + (k === app.difficulty) + '">' + esc(C.difficulties[k].label) + '</button>';
    }).join('');
    $('pv-romaji').innerHTML = '<button type="button" role="radio" data-romaji="0" aria-checked="' + !app.romaji + '">Hide</button><button type="button" role="radio" data-romaji="1" aria-checked="' + app.romaji + '">Show</button>';

    var ph = app.session.phrases, n = ph.length;
    $('preview-ask').innerHTML = n ? esc(n === 1 ? 'Check this item' : 'Check these ' + n + ' items') +
      '<small>Only these will fall in the game — again and again. Read each one before you start.</small>' : '';
    var c = counts(ph), note = $('preview-note');
    note.classList.add('hidden');
    if (app.set === 'normal' && c.mastered > 0) { note.textContent = 'Almost everything here is mastered — a few mastered items are mixed in for review.'; note.classList.remove('hidden'); }
    else if (app.set === 'normal' && c.new > 0 && c.learning > 0) { note.textContent = c.learning + ' to keep practising + ' + c.new + ' new.'; note.classList.remove('hidden'); }
    else if (app.set === 'mastered') { note.textContent = 'Keep your mastered items fresh. A mistake sends an item back to practice.'; note.classList.remove('hidden'); }
    $('preview-list').innerHTML = n ? ph.map(function (p) { return rowHTML(p, { markNew: app.set === 'normal', markReview: true }); }).join('')
      : '<div class="empty">Choose at least one type to practise.</div>';
    $('preview-start').disabled = n === 0;
  }

  $('pv-kinds').addEventListener('click', function (e) {
    var b = e.target.closest('[data-kind]'); if (!b || b.disabled) return;
    var k = b.getAttribute('data-kind');
    if (app.kinds[0] === k) return;
    app.kinds = [k];
    P.setting('kinds', app.kinds);
    app.session = null; renderPractice();
  });
  $('pv-set').addEventListener('click', function (e) {
    var b = e.target.closest('[data-set]'); if (!b || b.disabled) return;
    app.set = b.getAttribute('data-set'); app.session = null; renderPractice();
  });
  $('speed-seg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-speed]'); if (!b) return;
    app.difficulty = b.getAttribute('data-speed');
    P.setting('difficulty', app.difficulty);
    this.querySelectorAll('[data-speed]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  });
  $('pv-romaji').addEventListener('click', function (e) {
    var b = e.target.closest('[data-romaji]'); if (!b) return;
    app.romaji = b.getAttribute('data-romaji') === '1';
    P.setting('romaji', app.romaji);
    this.querySelectorAll('[data-romaji]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
  });
  $('pv-back').addEventListener('click', function () { go(sceneHash('scene', app.scene)); });
  $('preview-start').addEventListener('click', function () {
    if (!app.session || !app.session.phrases.length) return;
    app.pendingStart = true;
    go('game');
  });

  /* ---------------- game ---------------- */
  var G = {
    view: $('view-game'), lane: $('g-lane'), card: $('g-card'), who: $('g-who'), jp: $('g-jp'), romaji: $('g-rom'), reveal: $('g-reveal'), dots: $('g-dots'),
    pops: $('g-pops'), count: $('g-count'), answers: $('g-answers'), buttons: Array.prototype.slice.call(document.querySelectorAll('#g-answers .ans')),
    score: $('g-score'), combo: $('g-combo'), comboBox: $('g-combobox'), mult: $('g-mult'), mastered: $('g-mastered'),
    time: $('g-time'), timeBox: $('g-timebox'), timeFill: $('g-timefill')
  };

  function startGame() {
    Audio.stop();
    var sess = app.session, scene = sceneItems(sess.scene);
    var pool = scene.filter(function (p) { return sess.kinds.indexOf(p.group) >= 0; });
    VIEWS.forEach(function (v) { $('view-' + v).classList.add('hidden'); });
    document.body.classList.add('in-game');
    G.view.classList.remove('hidden');
    $('g-pausebox').classList.add('hidden');
    app.game = window.RVRGame.create({
      config: C, progress: P, shuffle: Session.shuffle,
      phrases: sess.phrases,
      scope: pool,                                                         // choices come from what was studied…
      fallback: [], // Never mix Vocabulary, Customer, and Staff in answer choices
      confusableGroups: CONFUSABLE,
      showRomaji: app.romaji,
      difficulty: app.difficulty, mode: C.mode, els: G,
      playAudio: function (p) { Audio.play(p); },
      onEnd: function (res) {
        res.scene = sess.scene; res.kinds = sess.kinds; res.set = sess.set;
        app.lastResult = res;
        app.game = null;
        exitGameUI();
        go('results', true);
      }
    });
    app.game.start();
  }

  function exitGameUI() {
    document.body.classList.remove('in-game');
    G.view.classList.add('hidden');
    $('g-pausebox').classList.add('hidden');
  }
  function leaveGame() {
    if (app.game) { app.game.destroy(); app.game = null; }
    exitGameUI();
  }
  function pauseGame() {
    if (!app.game || !app.game.pause()) return;
    $('g-pausebox').classList.remove('hidden');
    $('g-resume').focus({ preventScroll: true });
  }
  function resumeGame() {
    if (!app.game) return;
    $('g-pausebox').classList.add('hidden');
    app.game.resume();
  }

  G.buttons.forEach(function (b, i) { b.addEventListener('click', function () { if (app.game) app.game.answer(i); }); });
  $('g-pause').addEventListener('click', pauseGame);
  $('g-resume').addEventListener('click', resumeGame);
  $('g-finish').addEventListener('click', function () { $('g-pausebox').classList.add('hidden'); if (app.game) app.game.finishNow(); });
  $('g-quit').addEventListener('click', function () { go(app.scene ? sceneHash('scene', app.scene) : 'home'); });

  // Leaving the tab / app pauses the clock, so time never runs while the page is hidden.
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseGame(); });
  window.addEventListener('blur', pauseGame);
  window.addEventListener('pagehide', pauseGame);

  document.addEventListener('keydown', function (e) {
    if (!app.game) return;
    if (app.game.isPaused()) { if (e.key === 'Escape') { e.preventDefault(); resumeGame(); } return; }
    if (e.repeat) return;
    var n = ['1', '2', '3', '4'].indexOf(e.key);
    if (n < 0 && e.code && /^Numpad[1-4]$/.test(e.code)) n = Number(e.code.slice(-1)) - 1;
    if (n >= 0) { e.preventDefault(); app.game.answer(n); return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { e.preventDefault(); pauseGame(); }
  });
  G.view.addEventListener('touchmove', function (e) { if (!e.target.closest('.sheet')) e.preventDefault(); }, { passive: false });

  /* ---------------- results ---------------- */
  function renderResults() {
    var r = app.lastResult;
    $('r-score').textContent = r.score.toLocaleString('en-US');
    $('r-acc').textContent = r.accuracy + '%';
    $('r-acc-sub').textContent = r.correct + ' of ' + r.answered + ' correct';
    $('r-combo').textContent = r.bestCombo;
    $('r-mastered').textContent = r.newlyMastered.length;
    $('r-mastered-sub').textContent = r.set === 'mastered' ? 'kept: ' + r.masteredInSet.length + '/' + r.ids.length : 'this game';
    $('r-review').textContent = r.missed.length;
    $('r-cheer').textContent = r.answered === 0 ? 'No answers this time — give it another go!'
      : r.accuracy >= 90 ? 'Amazing! すばらしい！'
      : r.accuracy >= 70 ? 'Great job! よくできました！'
      : 'Nice try! Review the items below and play again.';

    var mList = (r.set === 'mastered' ? r.masteredInSet : r.newlyMastered).map(function (id) { return byId[id]; }).filter(Boolean);
    $('r-mastered-wrap').classList.toggle('hidden', mList.length === 0);
    $('r-mastered-wrap').querySelector('h3').lastChild.textContent = r.set === 'mastered' ? 'Still Mastered' : 'Mastered This Game';
    $('r-mastered-list').innerHTML = mList.map(function (p) { return rowHTML(p, { noMeta: true }); }).join('');
    $('r-review-wrap').classList.toggle('hidden', r.missed.length === 0);
    $('r-review-list').innerHTML = r.missed.map(function (m) { return rowHTML(byId[m.id], { noMeta: true, times: m.times }); }).join('');
    $('r-mistakes').disabled = r.missed.length === 0;
  }

  function restoreScope(r) { app.scene = r.scene; app.kinds = r.kinds.slice(); }
  $('r-again').addEventListener('click', function () {
    var r = app.lastResult; restoreScope(r);
    app.set = r.set === 'normal' ? 'normal' : r.set;
    app.session = null;
    go(sceneHash('practice', r.scene));
  });
  $('r-mistakes').addEventListener('click', function () {
    var r = app.lastResult; if (!r.missed.length) return;
    restoreScope(r);
    var pool = sceneItems(r.scene);
    app.set = 'mistakes';
    app.session = Session.build('custom', pool, { ids: r.missed.map(function (m) { return m.id; }), label: 'mistakes' });
    app.session.scene = r.scene; app.session.kinds = r.kinds.slice(); app.session.set = 'mistakes';
    // keep exactly this game's mistakes (not the whole To Review list)
    location.hash === '#' + sceneHash('practice', r.scene) ? renderPractice() : (location.hash = sceneHash('practice', r.scene));
  });
  $('r-scene').addEventListener('click', function () { go(sceneHash('scene', app.lastResult.scene)); });

  /* ---------------- progress ---------------- */
  function renderProgress() {
    var c = counts(ITEMS), pct = Math.round(c.mastered / ITEMS.length * 100);
    $('pg-ring').style.setProperty('--p', pct + '%');
    $('pg-pct').textContent = pct + '%';
    $('pg-m').textContent = c.mastered; $('pg-l').textContent = c.learning; $('pg-n').textContent = c.new; $('pg-r').textContent = c.review;
    var tot = ITEMS.reduce(function (a, p) { var r = P.get(p.id); a.c += r.correct; a.s += r.seen; return a; }, { c: 0, s: 0 });
    $('pg-acc').textContent = tot.s ? 'Overall accuracy: ' + Math.round(tot.c / tot.s * 100) + '% (' + tot.s + ' answers)' : 'No games played yet.';
    $('pg-cats').innerHTML = SCENES.map(function (s) {
      var list = sceneItems(s.key), cc = counts(list);
      return '<button type="button" class="cat link" data-scene="' + esc(s.key) + '"><div class="cat-top"><b>' + esc(s.key) + ' <small lang="ja">' + esc(s.ja) + '</small></b><span>' + cc.mastered + ' / ' + list.length + ' mastered' +
        (cc.review ? ' · <span class="rv">' + cc.review + ' to review</span>' : '') + '</span></div>' + stackHTML(list) + '</button>';
    }).join('');
  }
  $('pg-reset').addEventListener('click', function () { openDialog($('confirm-dialog')); });
  $('confirm-ok').addEventListener('click', function () {
    P.reset(ITEMS.map(function (p) { return p.id; }));
    closeDialog($('confirm-dialog'));
    app.session = null;
    renderProgress();
    toast('Progress has been reset.');
  });

  /* ---------------- dialogs ---------------- */
  function openDialog(d) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) { if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); }
  document.querySelectorAll('[data-open-help]').forEach(function (b) { b.addEventListener('click', function () { openDialog($('help-dialog')); }); });
  document.querySelectorAll('.dlg').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) closeDialog(d); });
  });
  $('help-streak').textContent = C.masteryStreak;

  /* ---------------- saving problems ---------------- */
  function showSaveWarning() { $('save-warn').classList.remove('hidden'); }
  if (!P.isAvailable()) showSaveWarning();
  P.onSaveFail(function () { showSaveWarning(); toast('Progress could not be saved. You can keep playing.', 3500); });

  route();
})();
