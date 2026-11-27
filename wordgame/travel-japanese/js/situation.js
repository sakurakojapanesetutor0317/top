/* =========================================================================
   Which situation (Restaurant, Café, …) is open — read from the address:
     index.html                      → list of situations
     index.html?situation=cafe       → the Café pages
     index.html#scene/… (no ?situation) → Restaurant, so links from the
                                       Restaurant-only version keep working
   Everything comes from js/data.js (generated from the Google Sheet). Adding
   a situation needs no change here: add it to the Sheet and rebuild.
   ========================================================================= */
(function () {
  'use strict';
  var DATA = window.RVR_DATA;
  var params = new URLSearchParams(location.search);
  var asked = (params.get('situation') || '').toLowerCase();
  var byKey = {};
  DATA.situations.forEach(function (s) { byKey[s.key] = s; });

  var key = byKey[asked] ? asked : null;
  if (!key && !asked && location.hash.length > 1) key = byKey.restaurant ? 'restaurant' : null;

  function itemsOf(k) {
    // copy each shared item with the scene it has in this situation
    return DATA.items.filter(function (p) { return p.uses[k]; }).map(function (p) {
      var c = {}; for (var f in p) c[f] = p[f];
      c.scene = p.uses[k];
      return c;
    });
  }

  window.RVR_SITUATIONS = DATA.situations;
  window.RVR_SITUATION = key;                       // null = show the list of situations
  window.RVR_CURRENT = key ? {
    key: key,
    name: byKey[key].name,
    ja: byKey[key].ja,
    icon: byKey[key].icon,
    scenes: byKey[key].scenes,
    items: itemsOf(key),
    tips: DATA.tips.filter(function (t) { return t.uses[key]; }).map(function (t) {
      var c = {}; for (var f in t) c[f] = t[f];
      c.scene = t.uses[key];
      return c;
    })
  } : null;
  window.RVR_itemsOf = itemsOf;
  if (key) document.title = byKey[key].name + ' Japanese · Sakura Japanese';
})();
