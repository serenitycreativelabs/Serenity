// Editor teks kaya (font, ukuran, warna, tebal, miring), sanitasi HTML aman, konversi ke WhatsApp,
// serta penyematan media dari URL (YouTube, foto, Google Drive).  © Serenity Creativa 2026
import { esc, waFormat } from './ui.js';

export const FONTS = [
  ['', 'Font bawaan'], ['Inter', 'Inter (modern)'], ['Plus Jakarta Sans', 'Jakarta Sans'], ['Lora', 'Lora (serif)'],
  ['Nunito', 'Nunito (ramah)'], ['Georgia', 'Georgia'], ['Courier New', 'Courier (mono)'],
];
export const SIZES = [['0.85em', 'Kecil'], ['1em', 'Normal'], ['1.25em', 'Besar'], ['1.6em', 'Sangat besar'], ['2em', 'Judul']];
export const COLORS = ['#111827', '#0f766e', '#1d4ed8', '#7c3aed', '#be123c', '#c2410c', '#a16207', '#15803d', '#475569', '#ffffff'];
const FONT_OK = new Set(FONTS.map((f) => f[0].toLowerCase()).filter(Boolean));

// ---------------------------------------------------------------- sanitasi
const TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'SPAN', 'UL', 'OL', 'LI', 'A', 'BLOCKQUOTE', 'H3', 'H4']);
function cleanStyle(style) {
  const out = [];
  for (const part of String(style || '').split(';')) {
    const [k, ...rest] = part.split(':'); const prop = (k || '').trim().toLowerCase(); const val = rest.join(':').trim();
    if (!val || /url\(|expression|javascript|[<>]/i.test(val)) continue;
    if (prop === 'color' || prop === 'background-color') { if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(val)) out.push(`${prop}:${val}`); }
    else if (prop === 'font-family') { const f = val.split(',')[0].replace(/["']/g, '').trim(); if (FONT_OK.has(f.toLowerCase())) out.push(`font-family:'${f}'`); }
    else if (prop === 'font-size') { if (/^(\d{1,2}(\.\d+)?(em|rem|px|%)|small|medium|large|x-large|xx-large)$/i.test(val)) out.push(`font-size:${val}`); }
    else if (prop === 'font-weight') { if (/^(bold|normal|[1-9]00)$/i.test(val)) out.push(`font-weight:${val}`); }
    else if (prop === 'font-style') { if (/^(italic|normal)$/i.test(val)) out.push(`font-style:${val}`); }
    else if (prop === 'text-decoration' || prop === 'text-decoration-line') { if (/^(underline|line-through|none)$/i.test(val)) out.push(`text-decoration:${val}`); }
    else if (prop === 'text-align') { if (/^(left|right|center|justify)$/i.test(val)) out.push(`text-align:${val}`); }
  }
  return out.join(';');
}
export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${String(html || '')}</div>`, 'text/html');
  const walk = (node) => {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) continue;
      if (ch.nodeType !== 1) { ch.remove(); continue; }
      let el = ch;
      if (el.tagName === 'FONT') { // <font> → <span style>
        const sp = doc.createElement('span'); const st = [];
        if (el.getAttribute('color')) st.push(`color:${el.getAttribute('color')}`);
        if (el.getAttribute('face')) st.push(`font-family:${el.getAttribute('face')}`);
        sp.setAttribute('style', st.join(';')); while (el.firstChild) sp.appendChild(el.firstChild); el.replaceWith(sp); el = sp;
      }
      if (!TAGS.has(el.tagName)) { if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE'].includes(el.tagName)) { el.remove(); continue; } walk(el); el.replaceWith(...el.childNodes); continue; }
      const style = cleanStyle(el.getAttribute('style'));
      const href = el.tagName === 'A' ? el.getAttribute('href') : null;
      for (const a of [...el.attributes]) el.removeAttribute(a.name);
      if (style) el.setAttribute('style', style);
      if (href && /^(https?:|mailto:|tel:)/i.test(href.trim())) { el.setAttribute('href', href.trim()); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener nofollow'); }
      walk(el);
    }
  };
  const root = doc.body.firstChild; walk(root);
  return root.innerHTML.replace(/(<br>\s*){3,}/g, '<br><br>').trim();
}
export const isHtml = (s) => /<\/?(b|i|u|s|em|strong|span|p|div|br|ul|ol|li|a|h3|h4|blockquote)\b/i.test(String(s || ''));
// Tampilkan teks deskripsi: HTML aman, atau teks lama bergaya WhatsApp
export const richRender = (s) => (isHtml(s) ? sanitizeHtml(s) : waFormat(s || ''));
// HTML → teks WhatsApp (*tebal*, _miring_, ~coret~)
export function htmlToWa(s) {
  if (!isHtml(s)) return String(s || '');
  const doc = new DOMParser().parseFromString(`<div>${sanitizeHtml(s)}</div>`, 'text/html');
  const conv = (n) => {
    if (n.nodeType === 3) return n.nodeValue;
    if (n.nodeType !== 1) return '';
    const inner = [...n.childNodes].map(conv).join('');
    const st = (n.getAttribute('style') || '').toLowerCase();
    const wrap = (t, m) => (t.trim() ? t.replace(/^(\s*)([\s\S]*?)(\s*)$/, `$1${m}$2${m}$3`) : t);
    let t = inner;
    if (['B', 'STRONG', 'H3', 'H4'].includes(n.tagName) || /font-weight:\s*(bold|[6-9]00)/.test(st)) t = wrap(t, '*');
    if (['I', 'EM'].includes(n.tagName) || /font-style:\s*italic/.test(st)) t = wrap(t, '_');
    if (n.tagName === 'S' || /line-through/.test(st)) t = wrap(t, '~');
    if (n.tagName === 'BR') return '\n';
    if (n.tagName === 'LI') return `• ${t}\n`;
    if (['P', 'DIV', 'H3', 'H4', 'BLOCKQUOTE', 'UL', 'OL'].includes(n.tagName)) return `${t}\n`;
    if (n.tagName === 'A') return n.getAttribute('href') && !t.includes(n.getAttribute('href')) ? `${t} (${n.getAttribute('href')})` : t;
    return t;
  };
  return conv(doc.body.firstChild).replace(/\n{3,}/g, '\n\n').trim();
}
export const plainText = (s) => (isHtml(s) ? (new DOMParser().parseFromString(sanitizeHtml(s), 'text/html').body.textContent || '') : String(s || '').replace(/[*_~]/g, ''));

// ---------------------------------------------------------------- editor
// Pasang editor pada <textarea data-rich>. Nilai textarea selalu berisi HTML yang sudah disanitasi,
// sehingga kode penyimpanan lama tetap bekerja.
export function attachRich(ta) {
  if (ta._rich) return ta._rich;
  // <label> pembungkus akan mengalihkan klik ke kontrol lain → ganti dengan <div>
  const lab = ta.closest('label');
  if (lab) { const div = document.createElement('div'); div.className = lab.className; while (lab.firstChild) div.appendChild(lab.firstChild); lab.replaceWith(div); }
  const wrap = document.createElement('div'); wrap.className = 'rte';
  const bar = document.createElement('div'); bar.className = 'rte-bar'; bar.setAttribute('role', 'toolbar');
  bar.innerHTML = `
    <select data-cmd="font" title="Pilihan font">${FONTS.map(([v, l]) => `<option value="${esc(v)}" style="font-family:'${esc(v)}'">${esc(l)}</option>`).join('')}</select>
    <select data-cmd="size" title="Ukuran font"><option value="">Ukuran</option>${SIZES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
    <span class="rte-sep"></span>
    <button type="button" data-cmd="bold" title="Tebal (Ctrl+B)"><b>B</b></button>
    <button type="button" data-cmd="italic" title="Miring (Ctrl+I)"><i>I</i></button>
    <button type="button" data-cmd="underline" title="Garis bawah"><u>U</u></button>
    <span class="rte-color"><button type="button" data-cmd="colorbtn" title="Warna teks"><span class="rte-a">A</span><span class="rte-sw"></span></button>
      <span class="rte-pal">${COLORS.map((c) => `<button type="button" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}<label class="rte-custom" title="Warna lain"><input type="color" data-cmd="color" value="#0f766e">＋</label></span></span>
    <span class="rte-sep"></span>
    <button type="button" data-cmd="insertUnorderedList" title="Daftar berpoin">•≡</button>
    <button type="button" data-cmd="insertOrderedList" title="Daftar bernomor">1.</button>
    <button type="button" data-cmd="removeFormat" title="Hapus format">⨯</button>`;
  const ed = document.createElement('div'); ed.className = 'rte-area'; ed.contentEditable = 'true';
  ed.setAttribute('role', 'textbox'); ed.setAttribute('aria-multiline', 'true');
  ed.style.minHeight = `${Math.max(3, Number(ta.getAttribute('rows')) || 4) * 1.6}em`;
  if (ta.placeholder) ed.dataset.placeholder = ta.placeholder;
  ed.innerHTML = isHtml(ta.value) ? sanitizeHtml(ta.value) : waFormat(ta.value || '');
  ta.parentNode.insertBefore(wrap, ta); wrap.append(bar, ed, ta); ta.hidden = true;
  let saved = null;
  const keep = () => { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); };
  const restore = () => { ed.focus(); if (saved) { const s = getSelection(); s.removeAllRanges(); s.addRange(saved); } };
  const sync = () => { ta.value = ed.textContent.trim() || ed.querySelector('img,li') ? sanitizeHtml(ed.innerHTML) : ''; ta.dispatchEvent(new Event('input', { bubbles: true })); };
  const exec = (cmd, val, css = true) => { restore(); try { document.execCommand('styleWithCSS', false, css); } catch { /* */ } document.execCommand(cmd, false, val); keep(); sync(); };
  ed.addEventListener('input', sync); ed.addEventListener('keyup', keep); ed.addEventListener('mouseup', keep); ed.addEventListener('blur', keep);
  ed.addEventListener('paste', (e) => { // tempel sebagai teks aman
    e.preventDefault();
    const html = e.clipboardData.getData('text/html'); const txt = e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, html ? sanitizeHtml(html) : esc(txt).replace(/\n/g, '<br>'));
  });
  bar.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.color) { exec('foreColor', b.dataset.color); bar.querySelector('.rte-sw').style.background = b.dataset.color; bar.querySelector('.rte-color').classList.remove('open'); return; }
    const cmd = b.dataset.cmd;
    if (cmd === 'colorbtn') { bar.querySelector('.rte-color').classList.toggle('open'); return; }
    if (cmd) exec(cmd, null, false);
  });
  bar.querySelector('[data-cmd=color]').addEventListener('input', (e) => { exec('foreColor', e.target.value); bar.querySelector('.rte-sw').style.background = e.target.value; });
  bar.querySelector('[data-cmd=font]').addEventListener('change', (e) => { if (e.target.value) exec('fontName', e.target.value); else exec('removeFormat', null, false); e.target.selectedIndex = 0; });
  bar.querySelector('[data-cmd=size]').addEventListener('change', (e) => {
    const v = e.target.value; if (!v) return;
    exec('fontSize', '7', false);
    ed.querySelectorAll('font[size="7"]').forEach((f) => { const sp = document.createElement('span'); sp.style.fontSize = v; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); });
    sync(); e.target.selectedIndex = 0;
  });
  document.addEventListener('mousedown', (e) => { if (!e.target.closest('.rte-color')) bar.querySelector('.rte-color')?.classList.remove('open'); });
  ta._rich = { el: ed, set: (v) => { ed.innerHTML = isHtml(v) ? sanitizeHtml(v) : waFormat(v || ''); sync(); } };
  return ta._rich;
}
export const bindRich = (root) => root.querySelectorAll('textarea[data-rich]').forEach(attachRich);

// ---------------------------------------------------------------- media dari URL
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : '';
}
export function driveId(url) {
  const m = String(url || '').match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{20,})/i);
  return m ? m[1] : '';
}
export const isImageUrl = (u) => /^data:image\//.test(u) || /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i.test(u) || /googleusercontent\.com|cdninstagram|fbcdn\.net|imgur\.com\/\w+\.(jpe?g|png)/i.test(u);
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) || /^data:image\//.test(String(u || '')) ? String(u).trim() : '');
export function mediaKind(url) {
  const u = safeUrl(url); if (!u) return '';
  if (youtubeId(u)) return 'youtube';
  if (driveId(u)) return 'drive';
  if (isImageUrl(u)) return 'image';
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return 'video';
  return 'link';
}
// Gambar mini (untuk kartu berita)
export function mediaThumb(url) {
  const k = mediaKind(url);
  if (k === 'youtube') return `https://img.youtube.com/vi/${youtubeId(url)}/hqdefault.jpg`;
  if (k === 'drive') return `https://drive.google.com/thumbnail?id=${driveId(url)}&sz=w800`;
  if (k === 'image') return safeUrl(url);
  return '';
}
// Sematan penuh (detail berita/lembaga)
export function mediaEmbed(item) {
  const url = typeof item === 'string' ? item : item?.url; const judul = typeof item === 'string' ? '' : item?.judul || '';
  const k = mediaKind(url); const u = safeUrl(url);
  const cap = judul ? `<figcaption>${esc(judul)}</figcaption>` : '';
  if (k === 'youtube') return `<figure class="media media-video"><div class="ratio"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(u)}" title="${esc(judul || 'Video YouTube')}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${cap}</figure>`;
  if (k === 'drive') return `<figure class="media media-video"><div class="ratio"><iframe src="https://drive.google.com/file/d/${driveId(u)}/preview" title="${esc(judul || 'Google Drive')}" loading="lazy" allow="autoplay" allowfullscreen></iframe></div>${cap}</figure>`;
  if (k === 'image') return `<figure class="media"><a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(judul)}" loading="lazy"></a>${cap}</figure>`;
  if (k === 'video') return `<figure class="media media-video"><video src="${esc(u)}" controls preload="metadata"></video>${cap}</figure>`;
  if (k === 'link') return `<a class="media-link" href="${esc(u)}" target="_blank" rel="noopener nofollow">🔗 ${esc(judul || u.replace(/^https?:\/\//, '').slice(0, 60))}</a>`;
  return '';
}
// "url | judul" per baris → [{url, judul}]
export function parseMediaLines(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [url, ...j] = l.split('|'); return { url: url.trim(), judul: j.join('|').trim() }; }).filter((x) => safeUrl(x.url)).slice(0, 30);
}
export const mediaLinesText = (arr) => (arr || []).map((m) => (m.judul ? `${m.url} | ${m.judul}` : m.url)).join('\n');
// Ubah link Google Drive menjadi link unduh langsung
export function downloadUrl(url) {
  const id = driveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : safeUrl(url);
}
