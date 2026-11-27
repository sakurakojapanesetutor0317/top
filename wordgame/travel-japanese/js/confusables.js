/* =========================================================================
   Extra "never show together" groups (by item ID), for quick fixes only.

   The normal place for these is the "Confusable Group" column in the Google
   Sheet: rows that share a tag are never answer choices in the same question.
   All groups that used to be listed here were moved to that column.

   The game also blocks pairs automatically when
     - their English uses the same key words (e.g. "Receipt" / "A receipt, please."), or
     - one Japanese text contains the other (e.g. ホット / ホットで。).
   tools/build_data.py applies the same rules and lists items that would have
   fewer than three fair wrong answers.
   ========================================================================= */
window.RVR_CONFUSABLE_GROUPS = [
  // ['C029', 'S022'],   // example
];
