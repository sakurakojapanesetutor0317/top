/* =========================================================================
   Restaurant Vocabulary Rush — settings
   Change game speed, length and mastery rules here. No other file needs editing.
   ========================================================================= */
window.RVR_CONFIG = {
  /* ---- session ---- */
  sessionSize: 12,          // phrases practised in one game
  durationSec: 180,         // game length in seconds
  masteryStreak: 3,         // correct answers in a row needed to master a phrase
  newPerSession: { min: 3, max: 6 }, // how many brand-new phrases are mixed in (when enough are left)

  /* ---- question mode ----
     'text'      : read the Japanese and choose the meaning (implemented)
     'listening' : hear the Japanese and choose the meaning (prepared for later; needs audio files) */
  mode: 'text',

  /* ---- difficulty ----
     speed > 1 falls faster, speed < 1 falls slower. The learner chooses one before each game. */
  defaultDifficulty: 'normal',
  difficulties: {
    relaxed: { label: 'Relaxed', speed: 0.75 },
    normal:  { label: 'Normal',  speed: 1 },
    quick:   { label: 'Quick',   speed: 1.35 }
  },

  /* ---- falling time (Text Mode) ----
     time to reach the bottom = baseMs + perCharMs × kana count, kept between minMs and maxMs,
     so longer phrases get more reading time without becoming a free pass. */
  fall: {
    baseMs: 5400,
    perCharMs: 190,
    minMs: 6500,
    maxMs: 11500,
    firstSeenBonus: 1.25,   // first appearance of a phrase in a game falls 25% slower
    rampEnd: 0.85           // by the end of the game everything falls 15% faster
  },

  /* ---- falling time (Listening Mode, for later) ---- */
  listening: {
    answerWindowMs: 5000,   // time to answer after the audio has finished
    fallbackAudioMs: 2000   // used when the audio length is not known yet
  },

  /* ---- score (kept separate from mastery) ---- */
  scoring: {
    base: 100,
    speedBonus: 100,        // up to +100 for answering early (measured as % of the fall, so fair for long phrases)
    comboSteps: [           // multiplier once the combo reaches "at"
      { at: 0,  x: 1 },
      { at: 3,  x: 1.5 },
      { at: 6,  x: 2 },
      { at: 10, x: 3 }
    ]
  },

  /* ---- pacing ---- */
  feedbackMs: { correct: 450, wrong: 1600, timeout: 1600 }, // pause before the next phrase
  countdownMs: 2400,        // "3 · 2 · 1" before the first phrase
  retryGap: 2,              // a missed phrase comes back after this many other questions

  storageKey: 'sakura-rvr-progress-v1'
};
