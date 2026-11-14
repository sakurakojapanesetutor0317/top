/* Sakura Japanese Practice — Conversation mode.
   The learner chooses a natural line from 3 options; some scenes begin with the learner.
   - Uses trial-lesson phrases, with contextual reply expressions where needed.
   - Mika's line plays its recording only when one of the 20 recordings says exactly that line.
   - 10 situations are drawn at random from SCENES each time; the reply order is shuffled too.
   A reply is a phrase id, or { jp, ro, en } when two lesson phrases are said together. */
(function () {
  'use strict';
  var $ = SJ.$, esc = SJ.esc, PH = window.PH;

  // replies[0] is the natural reply. The other two are lesson phrases that do not fit the situation.
  var SCENES = [
    { scene: 'Morning, 8 AM. You meet Mika.', mika: 'ohayou', replies: ['ohayou', 'konbanwa', 'sayounara'],
      why: 'Answer a greeting with the same greeting. In the morning: おはようございます.' },
    { scene: 'Afternoon, 2 PM. Mika says hello.', mika: 'konnichiwa', replies: ['konnichiwa', 'ohayou', 'arigatou_mashita'],
      why: 'In the daytime, say こんにちは back.' },
    { scene: 'Evening, 7 PM. You meet Mika.', mika: 'konbanwa', replies: ['konbanwa', 'konnichiwa', 'matane'],
      why: 'In the evening, say こんばんは back.' },
    { scene: 'You meet Mika for the first time.', mika: 'hajimemashite',
      replies: ['hajimemashite', 'ogenki', 'mataashita'],
      why: 'When you meet someone for the first time, you can reply with the same greeting: はじめまして.' },
    { scene: 'Mika finishes her self-introduction.', mika: 'yoroshiku', replies: [{ jp: 'こちらこそ、よろしく おねがいします', ro: 'kochira koso, yoroshiku onegaishimasu', en: 'Likewise, nice to meet you.' }, 'douzo', 'iidesuyo'],
      why: 'こちらこそ means “likewise.” Use it to return someone’s よろしく おねがいします.' },
    { scene: 'You feel great today.', mika: 'ogenki', replies: ['genki', 'maamaa', 'byouki'],
      why: 'げんきです means “I’m fine.”' },
    { scene: 'You feel just okay today.', mika: 'ogenki', replies: ['maamaa', 'genki', 'byouki'],
      why: 'まあまあです means “So-so.”' },
    { scene: 'You are not feeling well today.', mika: 'ogenki', replies: ['yokunai', 'genki', 'maamaa'],
      why: 'よくないです means “Not good.”' },
    { scene: 'It’s sunny today.', pic: 'images/icons/01_sunny.png', mika: 'tenkiToday', replies: ['hare', 'ame', 'kumori'],
      why: 'はれです means “It’s sunny.”' },
    { scene: 'It’s cloudy today.', pic: 'images/icons/02_partly_cloudy.png', mika: 'tenkiToday', replies: ['kumori', 'hare', 'ame'],
      why: 'くもりです means “It’s cloudy.”' },
    { scene: 'It’s raining today.', pic: 'images/icons/03_rainy.png', mika: 'tenkiToday', replies: ['ame', 'hare', 'kumori'],
      why: 'あめです means “It’s raining.”' },
    { scene: 'It’s very hot today.', pic: 'images/icons/05_beach.png', mika: 'tenkiToday', replies: ['atsui', 'samui', 'hare'],
      why: 'きょうは あついです means “It’s hot today.”' },
    { scene: 'It’s very cold today.', pic: 'images/icons/09_snowy_trees.png', mika: 'tenkiToday', replies: ['samui', 'atsui', 'ame'],
      why: 'きょうは さむいです means “It’s cold today.”' },
    { scene: 'You want to take a photo. Ask Mika for permission.', learnerFirst: true, mikaReply: 'iidesuyo',
      replies: ['shashinii', 'ogenki', 'tenki'],
      why: 'しゃしん、いいですか means “May I take a photo?” Mika replies: いいですよ (“Sure!”).' },
    { scene: 'You like cats too. Mika tells you she likes cats. What do you say?', mika: 'nekogasuki', replies: [{ jp: 'わたしもです', ro: 'watashi mo desu', en: 'Me too!' }, 'sumimasen', 'konbanwa'],
      why: 'わたしもです means “Me too!” Use も when the same thing is true for you.' },
    { scene: 'Mika hands you a coffee.', mika: 'douzo', replies: ['arigatou_masu', 'douzo', 'sayounara'],
      why: 'When someone gives you something now, say ありがとうございます.' },
    { scene: 'You want to say “Thank you as well.”', mika: 'arigatou_mashita',
      replies: [{ jp: 'こちらこそ、ありがとうございました', ro: 'kochira koso, arigatou gozaimashita', en: 'Thank you, too.' }, 'hajimemashite', 'ohayou'],
      why: 'こちらこそ、ありがとうございました means “Thank you as well.”' },
    { scene: 'You want to say “You’re welcome.”', mika: 'arigatou_mashita',
      replies: [{ jp: 'どういたしまして', ro: 'dou itashimashite', en: 'You’re welcome.' }, 'hajimemashite', 'konbanwa'],
      why: 'どういたしまして means “You’re welcome.”' },
    { scene: 'Mika is going home.', mika: 'matane', replies: ['jaamata', 'hajimemashite', 'ogenki'],
      why: 'A friendly goodbye: じゃあ、また.' }
  ];
  // Text-only question: no matching recording exists in the original 20 audio files.
  var TENKI_TODAY = { jp: 'きょうのてんきは どうですか', ro: 'kyou no tenki wa dou desu ka', en: 'How is the weather today?', audio: null };
  var PER_PLAY = 10;

  var I = {
    check: '<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    dot: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/></svg>',
    redo: '<svg class="i" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
  };
  var STATUS = { selected: I.dot + '<span>Selected</span>', correct: I.check + '<span>Correct</span>', wrong: I.x + '<span>Incorrect</span>' };
  var AVATAR = '<span class="avatar" aria-hidden="true"><img src="images/face.png" alt=""></span>';

  var list = [], idx = 0, score = 0, chosen = -1, checked = false, firstTry = true, missed = [], bound = false;

  function line(r) { return typeof r === 'string' ? PH[r] : r; }
  function s() { return list[idx]; }
  function opts() { return $('cv-area').querySelectorAll('.opt'); }
  function setState(el, state) {
    el.classList.remove('is-selected', 'is-correct', 'is-wrong');
    if (state) { el.classList.add('is-' + state); el.querySelector('.status').innerHTML = STATUS[state]; }
  }
  function mikaSays(p) {
    return '<div class="say mika">' + AVATAR + '<div><div class="who">Mika</div><div class="bubble">' +
      SJ.jr(p.jp, p.ro, p.en, 'left') + (p.audio ? SJ.miniPlay(p.audio, 'Play Mika’s line') : '') + '</div></div></div>';
  }
  function youSay(p) {
    return '<div class="say me"><div><div class="who">You</div><div class="bubble">' + SJ.jr(p.jp, p.ro, p.en, 'left') + '</div></div></div>';
  }
  function setEnglish(on) {
    $('view-conversation').classList.toggle('hide-en', !on);
    $('cv-enbtn').classList.toggle('on', on);
  }

  function render() {
    var sc = s(), m = sc.mika === 'tenkiToday' ? TENKI_TODAY : PH[sc.mika];
    checked = false; chosen = -1; firstTry = true;
    $('cv-count').textContent = (idx + 1) + ' / ' + list.length;
    $('cv-fill').style.width = ((idx + 1) / list.length * 100) + '%';
    $('cv-scene').innerHTML = (sc.pic ? '<img src="' + esc(sc.pic) + '" alt="">' : '') + '<span>' + esc(sc.scene) + '</span>';
    $('cv-chat').innerHTML = sc.learnerFirst ? '' : mikaSays(m);
    $('cv-area').innerHTML = '<div class="grid c3 meanings">' + sc.options.map(function (r, i) {
      var p = line(r);
      return '<button type="button" class="opt meaning reply" data-i="' + i + '"><span class="status"></span>' + SJ.jr(p.jp, p.ro, p.en) + '</button>';
    }).join('') + '</div>';
    opts().forEach(function (b) { b.addEventListener('click', function () { pick(Number(b.getAttribute('data-i'))); }); });
    $('cv-feedback').innerHTML = '';
    $('cv-retry').classList.add('hidden');
    $('cv-enbtn').classList.add('hidden');
    setEnglish(false);
    $('cv-next').textContent = 'Check';
    $('cv-next').disabled = true;
    if (m && m.audio) SJ.play(m.audio, $('cv-chat').querySelector('.mini-play'));
  }

  function pick(i) {
    if (checked) return;
    chosen = i;
    opts().forEach(function (b) { setState(b, Number(b.getAttribute('data-i')) === i ? 'selected' : null); });
    $('cv-next').disabled = false;
  }

  function check() {
    var sc = s(), ok = chosen === sc.answer, right = line(sc.options[sc.answer]);
    checked = true;
    if (ok && firstTry) score++;
    if (!ok && missed.indexOf(sc) < 0) missed.push(sc);
    firstTry = false;
    opts().forEach(function (b, i) {
      b.disabled = true;
      setState(b, i === sc.answer ? 'correct' : (i === chosen ? 'wrong' : null));
    });
    $('cv-chat').insertAdjacentHTML('beforeend', youSay(line(sc.options[chosen])));
    if (sc.learnerFirst && ok) $('cv-chat').insertAdjacentHTML('beforeend', mikaSays(PH[sc.mikaReply]));
    $('cv-feedback').innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'ng') + '" aria-live="polite">' +
      '<span class="icon">' + (ok ? I.check : I.redo) + '</span><div class="msg">' +
      '<div class="verdict">' + (ok ? 'Correct! よくできました' : 'Not quite — try again!') + '</div>' +
      SJ.jr(right.jp, right.ro, right.en, 'left') + '<p class="why">' + esc(sc.why) + '</p></div>' +
      (right.audio ? SJ.miniPlay(right.audio, 'Play the reply') : '') + '</div>';
    $('cv-enbtn').classList.remove('hidden');
    $('cv-next').textContent = idx === list.length - 1 ? 'See results' : 'Next';
    $('cv-retry').classList.toggle('hidden', ok);
  }

  function retry() {
    checked = false; chosen = -1;
    if (s().learnerFirst) $('cv-chat').innerHTML = '';
    else { var me = $('cv-chat').querySelector('.say.me'); if (me) me.remove(); }
    $('cv-feedback').innerHTML = '';
    $('cv-retry').classList.add('hidden');
    $('cv-enbtn').classList.add('hidden');
    setEnglish(false);
    $('cv-next').textContent = 'Check';
    $('cv-next').disabled = true;
    opts().forEach(function (b) { b.disabled = false; setState(b, null); });
  }

  function finish() {
    $('cv-play').classList.add('hidden');
    $('cv-result').classList.remove('hidden');
    setEnglish(true);
    $('cv-score').textContent = score;
    $('cv-of').textContent = 'of ' + list.length;
    $('cv-ring').style.setProperty('--p', (score / list.length * 100) + '%');
    $('cv-cheer').textContent = score === list.length ? 'Perfect! すばらしい！' : score >= 7 ? 'Great conversation! Keep it up.' : 'Nice try! Practice these replies again.';
    $('cv-review').innerHTML = missed.map(function (sc) {
      var m = sc.mika === 'tenkiToday' ? TENKI_TODAY : PH[sc.mika], r = line(sc.options[sc.answer]);
      if (sc.learnerFirst) return '<div class="reviewrow convo"><div class="pair">' +
        '<div class="pair-line"><span class="who">You</span>' + SJ.jr(r.jp, r.ro, r.en, 'left') + '</div>' +
        '<div class="pair-line"><span class="who">Mika</span>' + SJ.jr(PH[sc.mikaReply].jp, PH[sc.mikaReply].ro, PH[sc.mikaReply].en, 'left') + '</div></div></div>';
      return '<div class="reviewrow convo"><div class="pair">' +
        '<div class="pair-line"><span class="who">Mika</span>' + SJ.jr(m.jp, m.ro, m.en, 'left') + (m.audio ? SJ.miniPlay(m.audio) : '') + '</div>' +
        '<div class="pair-line"><span class="who">You</span>' + SJ.jr(r.jp, r.ro, r.en, 'left') + (r.audio ? SJ.miniPlay(r.audio) : '') + '</div>' +
        '</div></div>';
    }).join('');
    $('cv-reviewwrap').classList.toggle('hidden', missed.length === 0);
    window.scrollTo(0, 0);
  }

  function bind() {
    if (bound) return; bound = true;
    $('cv-next').addEventListener('click', function () {
      if (!checked) { check(); return; }
      if (idx === list.length - 1) { finish(); return; }
      idx++; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('cv-retry').addEventListener('click', retry);
    $('cv-again').addEventListener('click', function () { start(); });
    $('cv-enbtn').addEventListener('click', function () { setEnglish($('view-conversation').classList.contains('hide-en')); });
  }

  function start() {
    bind();
    list = SJ.shuffle(SCENES).slice(0, PER_PLAY).map(function (sc) {
      var order = SJ.shuffle([0, 1, 2]), c = {};
      for (var k in sc) c[k] = sc[k];
      c.options = order.map(function (o) { return sc.replies[o]; });
      c.answer = order.indexOf(0);
      return c;
    });
    idx = 0; score = 0; missed = [];
    $('cv-result').classList.add('hidden');
    $('cv-play').classList.remove('hidden');
    render();
  }

  window.ConversationMode = { start: start, scenes: SCENES };
})();
