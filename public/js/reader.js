// =============================================================
//  Serenity — Tata Baca (v2.9): satu kerangka untuk Papan Informasi, Berita Lembaga & Kegiatan Rutin
//  Tampilan dipilih Super Admin di Tampilan & Tema → "Model tampilan baca":
//   A · Kartu Baca  (html[data-baca="kartu"], bawaan)
//   B · Lembar Kertas (html[data-baca="kertas"])
//   C · Dua Kolom   (html[data-baca="duakolom"]) — otomatis satu kolom bila ruang sempit (ponsel/tablet)
//  Kerangka HTML sama untuk ketiganya; perbedaan diatur CSS sehingga ganti model tidak perlu memuat ulang.
//  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
// =============================================================
import { ic } from './core.js';
import { esc } from './ui.js';

/**
 * o = { back:{href,label}, badges, title, date, mins, byline, event:[{icon,text}], cover, body, media,
 *       actions, share:{href,label}, others:[{href,title,sub}], othersTitle }
 */
export function readerPage(o) {
  const ev = (o.event || []).filter((e) => e && e.text);
  const meta = [o.date && `${ic('cal')} ${esc(o.date)}`, o.mins && `${esc(o.mins)} menit baca`].filter(Boolean).join(' <span>·</span> ');
  const others = (o.others || []).filter(Boolean).slice(0, 4);
  const otherLinks = others.map((x) => `<a href="${esc(x.href)}">${esc(x.title)}${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</a>`).join('');
  return `<article class="section reader">
    ${o.back ? `<a href="${esc(o.back.href)}" class="link reader-back">← ${esc(o.back.label)}</a>` : ''}
    <div class="rv-wrap">
      <div class="rv-card">
        ${o.cover ? `<figure class="rv-cover"><img class="article-img" src="${esc(o.cover)}" alt="" onerror="this.closest('.rv-cover').remove()"></figure>` : ''}
        <header class="reader-head rv-pad">${o.badges ? `<div class="info-meta">${o.badges}</div>` : ''}
          <h1>${esc(o.title)}</h1>
          ${meta ? `<p class="reader-meta">${meta}</p>` : ''}
          ${o.byline || ''}</header>
        ${ev.length ? `<div class="event-box rv-pad rv-event">${ev.map((e) => `<span>${ic(e.icon)} ${esc(e.text)}</span>`).join('')}</div>` : ''}
        <div class="rv-pad rv-body">${o.body || ''}</div>
        ${o.media ? `<div class="rv-pad rv-mediawrap"><h3 class="reader-sub">${ic('image')} Foto & Video</h3><div class="reader-media">${o.media}</div></div>` : ''}
        ${o.actions ? `<div class="info-actions reader-actions">${o.actions}</div>` : ''}
      </div>
      <aside class="rv-side" aria-label="Info tulisan">
        <div class="rv-box rv-info"><h4>Info</h4>
          ${o.date ? `<div class="rv-kv">${ic('cal')}<span>${esc(o.date)}</span></div>` : ''}
          ${o.mins ? `<div class="rv-kv">${ic('book')}<span>${esc(o.mins)} menit baca</span></div>` : ''}
          ${o.author ? `<div class="rv-kv">${ic('users')}<span>${esc(o.author)}</span></div>` : ''}
          ${ev.map((e) => `<div class="rv-kv">${ic(e.icon)}<span>${esc(e.text)}</span></div>`).join('')}
          ${o.share ? `<a class="btn btn-wa btn-sm" href="${esc(o.share.href)}" target="_blank" rel="noopener">${ic('wa')} ${esc(o.share.label || 'Bagikan')}</a>` : ''}
        </div>
        ${others.length ? `<div class="rv-box rv-other"><h4>${esc(o.othersTitle || 'Lainnya')}</h4>${otherLinks}</div>` : ''}
      </aside>
    </div>
    ${others.length ? `<nav class="rv-more" aria-label="${esc(o.othersTitle || 'Lainnya')}"><h3 class="reader-sub">${esc(o.othersTitle || 'Lainnya')}</h3><div class="rv-more-list">${otherLinks}</div></nav>` : ''}
  </article>`;
}
export const readMins = (text) => Math.max(1, Math.round(String(text || '').split(/\s+/).filter(Boolean).length / 200));
