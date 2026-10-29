// Editor teks kaya (font, ukuran, warna, tebal, miring), sanitasi HTML aman, konversi ke WhatsApp,
// serta penyematan media dari URL (YouTube, foto, Google Drive).  Powered by Serenity Creativa Labs. © 2026 All Rights Reserved
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
// Warna netral (hampir hitam / hampir putih / abu tua) → biarkan tema yang menentukan warna teks
function neutralColor(v) {
  let r, g, b; const s = v.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) { let h = m[1]; if (h.length <= 4) h = h.split('').map((c) => c + c).join(''); r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16); }
  else { m = s.match(/rgba?\(([^)]+)\)/); if (!m) return false; [r, g, b] = m[1].split(',').map((x) => parseFloat(x)); }
  const max = Math.max(r, g, b), min = Math.min(r, g, b); const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return (max - min < 28 && (lum < 0.32 || lum > 0.85)) || lum > 0.94;
}
function cleanStyle(style) {
  const out = [];
  for (const part of String(style || '').split(';')) {
    const [k, ...rest] = part.split(':'); const prop = (k || '').trim().toLowerCase(); const val = rest.join(':').trim();
    if (!val || /url\(|expression|javascript|[<>]/i.test(val)) continue;
    // v2.7: warna latar dari teks tempelan (Word, WhatsApp Web, situs lain) TIDAK dipakai — itulah "kotak putih
    // kaku" di belakang tulisan. Warna teks hitam/putih bawaan tempelan juga dibuang agar mengikuti tema (terang/gelap).
    if (prop === 'color') { if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(val) && !neutralColor(val)) out.push(`color:${val}`); }
    else if (prop === 'font-family') { const f = val.split(',')[0].replace(/["']/g, '').trim(); if (FONT_OK.has(f.toLowerCase())) out.push(`font-family:'${f}'`); }
    else if (prop === 'font-size') { if (/^(\d{1,2}(\.\d+)?(em|rem|%)|small|medium|large|x-large|xx-large)$/i.test(val)) out.push(`font-size:${val}`); } // px dari tempelan diabaikan agar ukuran baca konsisten
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
// v2.7: tautan yang berdiri sendiri di satu baris otomatis menjadi pemutar video / foto (YouTube, TikTok,
// Instagram, Facebook, Vimeo, X, Spotify, Google Drive, gambar, video .mp4). Tautan lain menjadi kartu tautan.
export const richRender = (s, { embed = true } = {}) => { const h = isHtml(s) ? sanitizeHtml(s) : waFormat(s || ''); return embed ? enhanceLinks(h) : h; };
const URL_RE = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;
function enhanceLinks(html) {
  if (!/https?:\/\//i.test(html)) return html;
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html'); const root = doc.body.firstChild;
  // 1) URL teks biasa → tautan
  const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT); const texts = []; while (tw.nextNode()) if (!tw.currentNode.parentElement.closest('a')) texts.push(tw.currentNode);
  for (const t of texts) {
    const v = t.nodeValue; if (!URL_RE.test(v)) continue; URL_RE.lastIndex = 0;
    const frag = doc.createDocumentFragment(); let last = 0;
    v.replace(URL_RE, (u, _g, i) => { frag.append(v.slice(last, i)); const a = doc.createElement('a'); a.href = u; a.textContent = u; a.target = '_blank'; a.rel = 'noopener nofollow'; frag.append(a); last = i + u.length; return u; });
    frag.append(v.slice(last)); t.replaceWith(frag);
  }
  // 2) tautan yang berdiri sendiri pada barisnya → sematan
  const blank = (n) => !n || (n.nodeType === 3 && !n.nodeValue.trim());
  const edge = (n, dir) => { let x = n[dir]; while (x && blank(x) && x.nodeType === 3) x = x[dir]; return !x || x.nodeName === 'BR'; };
  for (const a of [...root.querySelectorAll('a[href]')]) {
    const href = a.getAttribute('href'); const kind = mediaKind(href);
    if (!kind || kind === 'link' && a.textContent.trim() !== href) continue;
    let host = a; while (host.parentElement && host.parentElement !== root && ['SPAN', 'B', 'STRONG', 'I', 'EM', 'U'].includes(host.parentElement.tagName) && host.parentElement.textContent.trim() === a.textContent.trim()) host = host.parentElement;
    if (!edge(host, 'previousSibling') || !edge(host, 'nextSibling')) continue;
    const box = doc.createElement('div'); box.className = 'rich-embed'; box.innerHTML = kind === 'link' ? linkCard(href) : mediaEmbed({ url: href });
    const blockParent = host.parentElement !== root && ['P', 'DIV'].includes(host.parentElement.tagName) && host.parentElement.textContent.trim() === a.textContent.trim() ? host.parentElement : host;
    blockParent.replaceWith(box);
  }
  return root.innerHTML;
}
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
export const tiktokId = (u) => (String(u).match(/tiktok\.com\/(?:@[\w.-]+\/video|embed(?:\/v2)?|v)\/(\d{8,})/i) || [])[1] || '';
export const instaCode = (u) => { const m = String(u).match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]{5,})/i); return m ? { t: m[1] === 'reels' ? 'reel' : m[1], c: m[2] } : null; };
export const vimeoId = (u) => (String(u).match(/vimeo\.com\/(?:video\/)?(\d{6,})/i) || [])[1] || '';
export const tweetId = (u) => (String(u).match(/(?:twitter|x)\.com\/[\w]+\/status(?:es)?\/(\d{8,})/i) || [])[1] || '';
export const isFacebook = (u) => /(?:facebook\.com|fb\.watch)\//i.test(u) && /(\/videos?\/|\/reel\/|watch|\/posts\/|\/permalink|story\.php|fb\.watch|\/share\/[vrp]\/)/i.test(u);
export const spotifyPath = (u) => (String(u).match(/open\.spotify\.com\/(?:intl-\w+\/)?((?:track|album|playlist|episode|show)\/[\w]+)/i) || [])[1] || '';
export function mediaKind(url) {
  const u = safeUrl(url); if (!u) return '';
  if (youtubeId(u)) return 'youtube';
  if (tiktokId(u)) return 'tiktok';
  if (instaCode(u)) return 'instagram';
  if (isFacebook(u)) return 'facebook';
  if (vimeoId(u)) return 'vimeo';
  if (tweetId(u)) return 'x';
  if (spotifyPath(u)) return 'spotify';
  if (driveId(u)) return 'drive';
  if (isImageUrl(u)) return 'image';
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(u)) return 'video';
  return 'link';
}
// Gambar mini (untuk kartu berita)
export function mediaThumb(url) {
  const k = mediaKind(url);
  if (k === 'youtube') return `https://img.youtube.com/vi/${youtubeId(url)}/hqdefault.jpg`;
  if (k === 'drive') return `https://drive.google.com/thumbnail?id=${driveId(url)}&sz=w800`;
  if (k === 'vimeo') return `https://vumbnail.com/${vimeoId(url)}.jpg`;
  if (k === 'image') return safeUrl(url);
  return '';
}
// Sematan penuh (detail berita/lembaga)
export function mediaEmbed(item) {
  const url = typeof item === 'string' ? item : item?.url; const judul = typeof item === 'string' ? '' : item?.judul || '';
  const k = mediaKind(url); const u = safeUrl(url);
  const cap = judul ? `<figcaption>${esc(judul)}</figcaption>` : '';
  if (k === 'youtube') return `<figure class="media media-video"><div class="ratio"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(u)}" title="${esc(judul || 'Video YouTube')}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${cap}</figure>`;
  const frame = (src, title, cls = '', extra = '') => `<figure class="media media-video ${cls}"><div class="ratio">${''}<iframe src="${esc(src)}" title="${esc(judul || title)}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" ${extra}></iframe></div>${cap}<a class="media-src" href="${esc(u)}" target="_blank" rel="noopener nofollow">Buka di ${esc(title)} ↗</a></figure>`;
  if (k === 'tiktok') return frame(`https://www.tiktok.com/embed/v2/${tiktokId(u)}`, 'TikTok', 'portrait');
  if (k === 'instagram') { const ig = instaCode(u); return frame(`https://www.instagram.com/${ig.t}/${ig.c}/embed/captioned/`, 'Instagram', 'portrait insta'); }
  if (k === 'facebook') return frame(`https://www.facebook.com/plugins/${/\/posts\/|permalink|story\.php|\/share\/p\//i.test(u) ? 'post' : 'video'}.php?href=${encodeURIComponent(u)}&show_text=false&width=560`, 'Facebook', /reel|\/share\/r\//i.test(u) ? 'portrait' : '');
  if (k === 'vimeo') return frame(`https://player.vimeo.com/video/${vimeoId(u)}?dnt=1`, 'Vimeo');
  if (k === 'x') return frame(`https://platform.twitter.com/embed/Tweet.html?id=${tweetId(u)}&dnt=true`, 'X (Twitter)', 'tweet');
  if (k === 'spotify') return `<figure class="media media-audio"><iframe src="https://open.spotify.com/embed/${esc(spotifyPath(u))}" title="${esc(judul || 'Spotify')}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" height="152"></iframe>${cap}</figure>`;
  if (k === 'drive') return `<figure class="media media-video"><div class="ratio"><iframe src="https://drive.google.com/file/d/${driveId(u)}/preview" title="${esc(judul || 'Google Drive')}" loading="lazy" allow="autoplay" allowfullscreen></iframe></div>${cap}</figure>`;
  if (k === 'image') return `<figure class="media media-img"><a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(driveImgFix(u))}" alt="${esc(judul)}" loading="lazy" onerror="this.closest('figure').classList.add('broken')"></a>${cap}</figure>`;
  if (k === 'video') return `<figure class="media media-video"><video src="${esc(u)}" controls preload="metadata"></video>${cap}</figure>`;
  if (k === 'link') return linkCard(u, judul);
  return '';
}
const driveImgFix = (u) => u;
// Kartu tautan (untuk tautan yang bukan video/foto)
export function linkCard(url, judul = '') {
  const u = safeUrl(url); if (!u) return '';
  let host = ''; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch { /* */ }
  return `<a class="link-card" href="${esc(u)}" target="_blank" rel="noopener nofollow"><img src="https://www.google.com/s2/favicons?domain=${esc(host)}&sz=64" alt="" loading="lazy" onerror="this.remove()"><span><b>${esc(judul || host)}</b><small>${esc(u.replace(/^https?:\/\//, '').slice(0, 80))}</small></span><i>↗</i></a>`;
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
