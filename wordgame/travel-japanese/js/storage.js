/* =========================================================================
   Learning records (kept apart from the score), saved in localStorage.
   If saving is impossible (private mode, storage full, blocked cookies) the
   game keeps working in memory and the app tells the learner.

   Progress from the first version (ids restaurant_001 … 032) is never deleted:
   - a one-time backup is written to "<storageKey>-backup-v1"
   - records are copied to the new Sheet ids (see MIGRATION_V1 below)
   - the old records stay in the file untouched
   ========================================================================= */
window.RVRProgress = (function () {
  'use strict';
  var C = window.RVR_CONFIG;
  var data = { version: 2, phrases: {}, settings: {}, migrations: [] };
  var available = true, failed = false, onFail = null;

  /* Old id → new Sheet id(s).
     exact: same Japanese → full record copied (mastery kept)
     near : same meaning, slightly different wording → answer history copied,
            but the phrase must be mastered again in its new form */
  var MIGRATION_V1 = {
    restaurant_001: { exact: ['C002'] },
    restaurant_002: { near: ['C006'] },
    restaurant_003: { near: ['C005'] },
    restaurant_004: { exact: ['C009'] },
    restaurant_005: { near: ['C039'] },
    restaurant_006: { near: ['C012'] },
    restaurant_007: { near: ['C016'] },
    restaurant_008: { exact: ['C018'] },
    restaurant_009: { exact: ['C024'] },
    restaurant_011: { near: ['C023'] },
    restaurant_012: { exact: ['C026'] },
    restaurant_013: { exact: ['C013'] },
    restaurant_014: { near: ['C053'] },
    restaurant_017: { near: ['C042'] },
    restaurant_018: { exact: ['S001'] },
    restaurant_019: { exact: ['S002'] },
    restaurant_020: { exact: ['S007'] },
    restaurant_021: { exact: ['S011'] },
    restaurant_022: { exact: ['S005', 'S023'] },
    restaurant_023: { exact: ['S034'] },
    restaurant_024: { exact: ['C066'] },
    restaurant_025: { near: ['C071'] },
    restaurant_026: { exact: ['C069'] },
    restaurant_028: { exact: ['C074'] },
    restaurant_030: { exact: ['C022'] },
    restaurant_031: { near: ['C054'] },
    restaurant_032: { near: ['C055'] }
    // restaurant_010, 015, 016, 027, 029 have no matching row in the Sheet: kept as they are.
  };

  function blank() {
    return { seen: 0, correct: 0, wrong: 0, streak: 0, mastered: false, masteredAt: null, lastSeen: null };
  }

  function migrateV1() {
    if (data.migrations.indexOf('v1-ids-to-sheet-ids') >= 0) return false;
    var moved = 0;
    Object.keys(MIGRATION_V1).forEach(function (oldId) {
      var old = data.phrases[oldId];
      if (!old) return;
      var m = MIGRATION_V1[oldId];
      (m.exact || []).concat(m.near || []).forEach(function (newId) {
        if (data.phrases[newId]) return;                 // never overwrite newer records
        var r = blank();
        for (var k in r) if (old[k] !== undefined) r[k] = old[k];
        if ((m.near || []).indexOf(newId) >= 0) { r.mastered = false; r.masteredAt = null; r.streak = 0; }
        data.phrases[newId] = r;
        moved++;
      });
    });
    data.migrations.push('v1-ids-to-sheet-ids');
    data.migratedV1Count = moved;
    return true;
  }

  function load() {
    try {
      var probe = '__rvr_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      var raw = window.localStorage.getItem(C.storageKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.phrases) {
          if (!parsed.migrations || parsed.migrations.indexOf('v1-ids-to-sheet-ids') < 0) {
            // one-time safety copy of the untouched first-version data
            if (!window.localStorage.getItem(C.storageKey + '-backup-v1')) window.localStorage.setItem(C.storageKey + '-backup-v1', raw);
          }
          data.phrases = parsed.phrases || {};
          data.settings = parsed.settings || {};
          data.migrations = parsed.migrations || [];
        }
      }
      if (migrateV1()) save();
    } catch (e) {
      available = false;
    }
  }

  function save() {
    if (!available) return false;
    try {
      data.version = 2;
      window.localStorage.setItem(C.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      if (!failed) { failed = true; if (onFail) onFail(e); }
      return false;
    }
  }

  function get(id) {
    var r = data.phrases[id], b = blank();
    if (!r) return b;
    for (var k in b) if (r[k] !== undefined) b[k] = r[k];
    return b;
  }

  /* One answer for one item. Returns what changed so the game can react. */
  function record(id, ok) {
    var r = get(id), wasMastered = r.mastered;
    r.seen++;
    r.lastSeen = Date.now();
    if (ok) {
      r.correct++;
      r.streak++;
      if (!r.mastered && r.streak >= C.masteryStreak) { r.mastered = true; r.masteredAt = Date.now(); }
    } else {
      r.wrong++;
      r.streak = 0;
      r.mastered = false;           // a mastered item that is missed goes back to practice
      r.masteredAt = null;
      r.lastWrong = Date.now();
    }
    data.phrases[id] = r;
    save();
    return { record: r, justMastered: !wasMastered && r.mastered, lostMastery: wasMastered && !r.mastered };
  }

  function status(id) {
    var r = get(id);
    if (r.mastered) return 'mastered';
    return r.seen > 0 ? 'learning' : 'new';
  }

  /* "To review": missed at some point and not mastered since. */
  function needsReview(id) {
    var r = get(id);
    return !r.mastered && r.wrong > 0;
  }

  function setting(key, value) {
    if (arguments.length === 1) return data.settings[key];
    data.settings[key] = value;
    save();
  }

  // Resets only the given ids (a scene), or everything when ids is omitted.
  function reset(ids) {
    if (ids) ids.forEach(function (id) { delete data.phrases[id]; });
    else data.phrases = {};
    save();
  }

  load();

  return {
    get: get, record: record, status: status, needsReview: needsReview,
    setting: setting, reset: reset,
    isAvailable: function () { return available && !failed; },
    onSaveFail: function (fn) { onFail = fn; }
  };
})();
