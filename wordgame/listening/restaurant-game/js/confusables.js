/* =========================================================================
   Items whose English meanings are too close to appear as choices in the
   same question (either could look correct). Hand-maintained: add a group
   whenever new rows in the Sheet create a new near-duplicate meaning.
   On top of this list, the game also blocks pairs automatically when their
   English uses the same key words (see game.js → similarEnglish).
   ========================================================================= */
window.RVR_CONFUSABLE_GROUPS = [
  // Entering / Seating
  ['S005', 'S010'],                 // Please wait a moment. / Please wait here.
  ['C037', 'S030'],                 // Counter seating is fine. / Would counter seating be okay?
  // Ordering
  ['C015', 'C016', 'C023'],         // This one, please. / One of these, please. / I'll have the same thing
  ['C026', 'C027'],                 // Water, please. / Cold water, please.
  ['C029', 'C030', 'S022'],         // That's all. / That's all for now. / Will that be all?
  ['S011', 'S014', 'C014'],         // Are you ready to order? / May I take your order? / Can I order now?
  ['S012', 'S013'],                 // Would you like something to drink? / What would you like to drink?
  ['S021', 'S022'],                 // Would you like anything else? / Will that be all?
  ['C024', 'C025'],                 // I haven't decided yet. / Could I have a little more time?
  ['V014', 'V015'],                 // Set meal / Set, Combo
  ['V020', 'V021'],                 // Addition, Extra order / Another serving, Refill
  ['V023', 'V024'],                 // Requires payment, Fee applies / Additional charge
  // During Meal
  ['C052', 'S037'],                 // You can take this plate away. / May I clear your plate?
  ['C047', 'S038'],                 // Can I get another serving of rice? / Would you like another serving?
  ['V021', 'V042'],                 // Another serving, Refill / Free refills
  // Problems
  ['C055', 'C056'],                 // I didn't order this. / This isn't what I ordered.
  ['C057', 'S043'],                 // Could you replace this? / I'll replace it right away.
  ['C059', 'C063'],                 // I have an allergy. / There are foods I can't eat.
  // Payment
  ['C067', 'C068', 'S046'],         // Where do I pay? / Do I pay here? / Please pay at the register.
  ['C074', 'C075', 'S051'],         // A receipt, please. / official receipt / Would you like a receipt?
  ['V059', 'V060'],                 // Receipt / Official receipt
  ['C070', 'S047'],                 // I'll pay for everyone together. / Will you be paying together?
  ['C071', 'C073'],                 // Do you accept cards? / Can I pay contactless?
  ['V057', 'V058'],                 // Electronic money / Contactless payment
  ['V061', 'V062'],                 // Service charge / Small appetizer (usually charged separately)
  // Leaving
  ['C077', 'C078', 'S053'],         // Thank you for the meal. / Thank you very much.
  ['C081', 'C082']                  // Can I get this to go? / Can I take the leftovers home?
];
