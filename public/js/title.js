// =============================================================
//  Serenity — Judul tab browser (v3.0.0: statis, tanpa gerak)
//  Judul tab selalu nama gampong saja, mis. "Deah Glumpang". Tanpa timer/worker → lebih hemat baterai.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
export function setMarqueeTitle(text) {
  text = String(text || '').replace(/\s+/g, ' ').trim();
  if (text && document.title !== text) document.title = text;
}
