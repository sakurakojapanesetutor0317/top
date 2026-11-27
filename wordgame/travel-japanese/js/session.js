/* =========================================================================
   Choosing the items for one game — always from the learner's chosen scope
   (one scene + the selected kinds: Vocabulary / Customer / Staff).
   normal : items in progress first, plus a few new ones; mastered items only
            fill up the set when too few are left.
   custom : a fixed list of ids (Review Mistakes, review of mastered items).
   ========================================================================= */
window.RVRSession = (function () {
  'use strict';
  var C = window.RVR_CONFIG, P = window.RVRProgress;

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // In-progress items: the ones the learner struggles with most come first.
  function byNeed(a, b) {
    var ra = P.get(a.id), rb = P.get(b.id);
    var na = ra.wrong - ra.correct * 0.5 - ra.streak, nb = rb.wrong - rb.correct * 0.5 - rb.streak;
    if (nb !== na) return nb - na;
    return (ra.lastSeen || 0) - (rb.lastSeen || 0);
  }

  /* pool: items in scope. opts.ids for custom sets. */
  function build(kind, pool, opts) {
    opts = opts || {};
    var size = C.sessionSize, picked;

    if (kind === 'custom') {
      var set = {}; (opts.ids || []).forEach(function (id) { set[id] = true; });
      picked = pool.filter(function (p) { return set[p.id]; });
      return { kind: kind, label: opts.label, phrases: shuffle(picked).slice(0, Math.max(size, picked.length)) };
    }

    var learning = pool.filter(function (p) { return P.status(p.id) === 'learning'; }).sort(byNeed);
    var fresh = pool.filter(function (p) { return P.status(p.id) === 'new'; });   // Sheet order
    var mastered = shuffle(pool.filter(function (p) { return P.status(p.id) === 'mastered'; }));

    var minNew = Math.min(C.newPerSession.min, fresh.length);
    picked = learning.slice(0, size - minNew);
    var nNew = learning.length === 0 ? size : Math.max(minNew, Math.min(C.newPerSession.max, size - picked.length));
    picked = picked.concat(pickNew(fresh, nNew));

    var used = {}; picked.forEach(function (p) { used[p.id] = true; });
    function fill(list) { list.forEach(function (p) { if (picked.length < size && !used[p.id]) { picked.push(p); used[p.id] = true; } }); }
    fill(learning); fill(fresh); fill(mastered);

    return { kind: kind, label: opts.label, phrases: shuffle(picked.slice(0, size)) };
  }

  // New items in Sheet order, alternating between kinds (vocabulary / customer / staff).
  function pickNew(fresh, n) {
    var groups = {}, order = [];
    fresh.forEach(function (p) {
      if (!groups[p.group]) { groups[p.group] = []; order.push(p.group); }
      groups[p.group].push(p);
    });
    var out = [];
    while (out.length < n && order.length) {
      order = order.filter(function (g) { return groups[g].length; });
      order.forEach(function (g) { if (out.length < n && groups[g].length) out.push(groups[g].shift()); });
    }
    return out;
  }

  return { build: build, shuffle: shuffle };
})();
