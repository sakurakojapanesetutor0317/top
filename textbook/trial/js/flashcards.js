/* Sakura Japanese Practice — Flashcards mode.
   The 20 phrases that have a recording. 10 random cards each time.
   Front: picture + a short situation cue → the learner says the Japanese first.
   Back : Japanese, romaji, English and the recording.  No score (this is review, not a test). */
(function () {
  'use strict';
  var $ = SJ.$, esc = SJ.esc, PH = window.PH;

  // phrase id → cue on the front (describes the situation, never the Japanese itself)
  var CUES = {
    ohayou: 'A greeting in the morning',
    konnichiwa: 'A greeting in the daytime',
    konbanwa: 'A greeting in the evening',
    hajimemashite: 'You meet someone for the first time.',
    arigatou_mashita: 'The lesson is over. Say thank you.',
    genki: '“How are you?” — You feel great.',
    maamaa: '“How are you?” — So-so.',
    ureshii: 'You feel happy!',
    kawaii: 'Look at this puppy!',
    kowai: 'Something is scary…',
    hare: 'How is the weather?',
    kumori: 'How is the weather?',
    ame: 'How is the weather?',
    atsui: 'Summer. Talk about today.',
    samui: 'Winter. Talk about today.',
    ogenki: 'You see a friend after a long time. Ask how they are.',
    doko: 'You are looking for the restroom.',
    ikura: 'You want to know the price.',
    shashinii: 'You want to take a photo. Ask first.',
    nekogasuki: 'Tell someone what animal you like.'
  };
  var PER_PLAY = 10;
  var BLOSSOM = '<svg viewBox="-28 -28 56 56" aria-hidden="true"><use href="#blossom"/></svg>';

  var deck = [], idx = 0, flipped = false, bound = false;

  function art(p, cls) {
    if (!p.img) return '<span class="art blank ' + cls + '">' + BLOSSOM + '</span>';
    var cover = /scenes\//.test(p.img);
    return '<span class="art ' + cls + '"><img src="' + esc(p.img) + '" alt="" class="' + (cover ? 'cover' : '') + '"></span>';
  }

  function render() {
    var p = PH[deck[idx]];
    flipped = false;
    $('fc-count').textContent = (idx + 1) + ' / ' + deck.length;
    $('fc-fill').style.width = ((idx + 1) / deck.length * 100) + '%';
    $('fc-card').classList.remove('flipped');
    $('fc-front').innerHTML = art(p, 'big') + '<p class="cue">' + esc(CUES[p.id] || '') + '</p>' +
      '<span class="hint">Say it in Japanese, then tap to flip</span>';
    $('fc-back').innerHTML = art(p, 'small') + SJ.jr(p.jp, p.ro, p.en) + SJ.miniPlay(p.audio, 'Play the Japanese');
    $('fc-card').setAttribute('aria-label', 'Card ' + (idx + 1) + ': ' + (CUES[p.id] || '') + ' Tap to flip.');
    $('fc-flip').textContent = 'Flip';
    $('fc-next').disabled = true;
    $('fc-next').textContent = idx === deck.length - 1 ? 'Finish' : 'Next';
  }

  function flip() {
    flipped = !flipped;
    $('fc-card').classList.toggle('flipped', flipped);
    $('fc-flip').textContent = flipped ? 'Flip back' : 'Flip';
    if (flipped) {
      $('fc-next').disabled = false;
      SJ.play(PH[deck[idx]].audio, $('fc-back').querySelector('.mini-play'));
    } else { SJ.stop(); }
  }

  function finish() {
    SJ.stop();
    $('fc-play').classList.add('hidden');
    $('fc-result').classList.remove('hidden');
    $('fc-total').textContent = deck.length;
    $('fc-review').innerHTML = deck.map(function (id) {
      var p = PH[id];
      return '<div class="reviewrow">' + SJ.jr(p.jp, p.ro, p.en, 'left') + SJ.miniPlay(p.audio) + '</div>';
    }).join('');
    window.scrollTo(0, 0);
  }

  function bind() {
    if (bound) return; bound = true;
    $('fc-card').addEventListener('click', flip);
    $('fc-card').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    $('fc-flip').addEventListener('click', flip);
    $('fc-next').addEventListener('click', function () {
      if (idx === deck.length - 1) { finish(); return; }
      idx++; SJ.stop(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('fc-again').addEventListener('click', function () { start(); });
  }

  function start() {
    bind();
    var withAudio = window.PHRASES.filter(function (p) { return p.audio; }).map(function (p) { return p.id; });
    deck = SJ.shuffle(withAudio).slice(0, PER_PLAY);
    idx = 0;
    $('fc-result').classList.add('hidden');
    $('fc-play').classList.remove('hidden');
    render();
  }

  window.FlashcardsMode = { start: start };
})();
