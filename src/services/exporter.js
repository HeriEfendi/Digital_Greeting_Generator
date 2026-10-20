import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { fontUrl, themeStylesMap } from '../constants/presets'

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]))
}

function fileName(n, p) {
  return `${p}-${n.replace(/[^\w.-]/g, '-')}`
}

export function getGoogleCalendarUrl(state) {
  const ev = state.sections.event
  if (!ev || !ev.date) return 'https://calendar.google.com'
  const d = new Date(ev.date)
  if (isNaN(d.getTime())) return 'https://calendar.google.com'

  const end = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  const formatGCal = date => date.toISOString().replace(/-|:|\.\d\d\d/g, '')

  const startStr = formatGCal(d)
  const endStr = formatGCal(end)
  const title = encodeURIComponent(state.sections.hero.title || state.meta.title || 'Acara Spesial')
  const details = encodeURIComponent(state.sections.hero.subtitle || '')
  const location = encodeURIComponent(`${ev.venue || ''} ${ev.address || ''}`.trim())

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`
}

export function generateExportedHtml(state, imgs, song, bgImg, qrisImg, monogramInitials = 'NA') {
  const x = state.sections
  const active = id => x[id]?.on
  const photos = state.gallery
    .map((p, i) =>
      imgs[i]
        ? `<figure class="gallery-figure" onclick="openLightbox(${i})"><img src="assets/${imgs[i]}" alt="${esc(p.caption || 'Kenangan')}"><figcaption>${esc(p.caption)}</figcaption><span class="zoom-badge">🔍 Perbesar</span></figure>`
        : ''
    )
    .join('')
  const bgCss = bgImg ? `background:url('assets/${bgImg}') center/cover fixed` : `background:${state.meta.bg_color}`
  const blurCss =
    state.meta.bg_blur > 0 && bgImg
      ? `backdrop-filter:blur(${state.meta.bg_blur}px);-webkit-backdrop-filter:blur(${state.meta.bg_blur}px)`
      : ''
  const font = state.meta.font_family
  const t = themeStylesMap[state.meta.theme_id] || themeStylesMap.romantic

  const faqItems = (x.faq.items || []).map(item => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')
  const mapUrl = (() => {
    try {
      const url = new URL(x.map.url)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch {
      return ''
    }
  })()

  // Story markup
  let storyMarkup = ''
  if (active('story')) {
    if (x.story.mode === 'timeline' && Array.isArray(x.story.items) && x.story.items.length) {
      const timelineHtml = x.story.items
        .map((it, idx) => {
          const isLast = idx === x.story.items.length - 1
          return `<div class="timeline-item"><div class="timeline-marker"><span class="timeline-dot"></span>${!isLast ? '<span class="timeline-line"></span>' : ''}</div><div class="timeline-content"><span class="timeline-year-badge">${esc(it.year)}</span><h4 class="timeline-title">${esc(it.title)}</h4><p class="timeline-desc">${esc(it.desc)}</p></div></div>`
        })
        .join('')
      storyMarkup = `<section class="section-story"><p class="label">OUR STORY</p><h2>${esc(x.story.title)}</h2><div class="story-timeline">${timelineHtml}</div></section>`
    } else {
      storyMarkup = `<section class="section-story"><p class="label">OUR STORY</p><h2>${esc(x.story.title)}</h2><p>${esc(x.story.body)}</p></section>`
    }
  }

  // Hero markup
  let heroMarkup = ''
  if (active('hero')) {
    const st = x.hero.style || 'classic'
    const kicker = esc(x.hero.kicker)
    const title = esc(x.hero.title)
    const subtitle = esc(x.hero.subtitle)
    const cta = esc(x.hero.cta)
    const monogram = esc(x.hero.monogram || monogramInitials)

    if (st === 'monogram') {
      heroMarkup = `<header class="hero hero-monogram"><div class="monogram-badge"><span class="monogram-ring"></span><span class="monogram-text">${monogram}</span></div><p class="label">${kicker}</p><h1>${title}</h1><p class="hero-sub">${subtitle}</p><a href="#details">${cta}</a></header>`
    } else if (st === 'split') {
      heroMarkup = `<header class="hero hero-split"><div class="split-pill-badge">✨ ${kicker}</div><h1>${title}</h1><div class="split-divider"></div><p class="hero-sub">${subtitle}</p><a href="#details">${cta}</a></header>`
    } else if (st === 'minimal') {
      heroMarkup = `<header class="hero hero-minimal"><div class="minimal-rule"><span></span><p class="label">${kicker}</p><span></span></div><h1>${title}</h1><p class="hero-sub minimal-sub">${subtitle}</p><a href="#details" class="minimal-btn">${cta}</a></header>`
    } else {
      heroMarkup = `<header class="hero"><p class="label">${kicker}</p><h1>${title}</h1><p class="hero-sub">${subtitle}</p><a href="#details">${cta}</a></header>`
    }
  }

  // Cover Envelope markup (FTR-01 & FTR-02)
  const coverMarkup = state.meta.enable_cover
    ? `
  <div id="envelope-cover" class="envelope-cover">
    <div class="envelope-card">
      <span class="cover-kicker">${esc(state.meta.cover_kicker || 'UNDANGAN DIGITAL')}</span>
      <h1 class="cover-title">${esc(x.hero.title)}</h1>
      <div class="cover-divider"></div>
      <p class="cover-subtitle">${esc(state.meta.cover_subtitle || 'Spesial Mengundang Bapak/Ibu/Saudara/i:')}</p>
      <div class="cover-guest-badge">
        <span id="cover-guest-name">Tamu Undangan</span>
      </div>
      <button id="btn-open-envelope" class="cover-open-btn">
        <span class="btn-icon">💌</span> Buka Undangan
      </button>
    </div>
  </div>`
    : ''

  // Google Calendar link (FTR-04)
  const calendarMarkup = x.event.enable_calendar
    ? `
  <a href="${getGoogleCalendarUrl(state)}" target="_blank" rel="noopener" class="calendar-btn">
    📅 Simpan ke Google Calendar
  </a>`
    : ''

  // Gift section markup (FTR-03)
  const giftMarkup = active('gift')
    ? `
  <section class="section-gift">
    <h2>${esc(x.gift.title)}</h2>
    <p>${esc(x.gift.note)}</p>
    <div class="gift-card">
      <div class="gift-bank-info">
        <span class="bank-tag">TRANSFER BANK</span>
        <strong class="acc-num">${esc(x.gift.bank)}</strong>
        <p class="acc-holder">a.n. ${esc(x.gift.holder)}</p>
      </div>
      <button type="button" class="copy-acc-btn" onclick="copyGiftAcc('${esc(x.gift.bank)}')">
        📋 Salin No. Rekening
      </button>
    </div>
    ${
      qrisImg
        ? `
    <div class="qris-card">
      <p class="qris-title">Scan QRIS / E-Wallet</p>
      <img src="assets/${qrisImg}" alt="QRIS" class="qris-img">
    </div>`
        : ''
    }
  </section>`
    : ''

  // RSVP Section with WA button (FTR-05)
  const rsvpMarkup = active('rsvp')
    ? `
  <section id="section-rsvp">
    <h2>${esc(x.rsvp.title)}</h2>
    <p>${esc(x.rsvp.note)}</p>
    <form id="rsvp" onsubmit="submitRsvpForm(event)">
      <label>Nama Lengkap<input required name="name" placeholder="Nama kamu"></label>
      <label>Konfirmasi Kehadiran
        <select name="attendance">
          <option value="Hadir">Hadir</option>
          <option value="Belum bisa hadir">Belum bisa hadir</option>
          <option value="Masih ragu">Masih ragu</option>
        </select>
      </label>
      <label>Jumlah Kehadiran
        <select name="pax">
          <option value="1 Orang">1 Orang</option>
          <option value="2 Orang">2 Orang</option>
          <option value="3 Orang">3 Orang</option>
          <option value="4+ Orang">4+ Orang</option>
        </select>
      </label>
      <label>Ucapan & Doa Singkat<textarea name="notes" rows="2" placeholder="Tuliskan ucapan atau doa..."></textarea></label>
      <div class="rsvp-btn-row">
        <button type="submit" class="primary-btn">Kirim Konfirmasi</button>
        ${
          x.rsvp.enable_wa && x.rsvp.wa_number
            ? `
        <button type="button" id="btn-rsvp-wa" class="wa-btn" onclick="sendRsvpWhatsApp()">
          💬 Konfirmasi via WhatsApp
        </button>`
            : ''
        }
      </div>
      <p id="reply" aria-live="polite"></p>
    </form>
  </section>`
    : ''

  // Guestbook section (FTR-07)
  const guestbookMarkup = active('guestbook')
    ? `
  <section id="section-guestbook">
    <h2>${esc(x.guestbook.title)}</h2>
    <p>${esc(x.guestbook.note)}</p>
    <form id="guestbook-form" onsubmit="submitGuestbook(event)">
      <label>Nama Pengirim<input required name="wish_name" placeholder="Nama kamu"></label>
      <label>Doa &amp; Ucapan<textarea required name="wish_msg" rows="3" placeholder="Tuliskan doa restu untuk kami..."></textarea></label>
      <button type="submit" class="primary-btn">✨ Kirim Ucapan Doa</button>
    </form>
    <div id="guestbook-list" class="guestbook-list">
      ${(x.guestbook.items || [])
        .map(
          w => `
      <div class="wish-card">
        <div class="wish-header">
          <strong>${esc(w.name)}</strong>
          <span class="wish-time">${esc(w.date || 'Terkirim')}</span>
        </div>
        <p class="wish-body">${esc(w.message)}</p>
      </div>`
        )
        .join('')}
    </div>
  </section>`
    : ''

  // Lightbox overlay markup (FTR-06)
  const lightboxMarkup = `
  <div id="lightbox" class="lightbox-overlay" style="display:none" onclick="if(event.target===this)closeLightbox()">
    <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
    <button class="lightbox-nav lightbox-prev" onclick="prevLightbox()">&#10094;</button>
    <div class="lightbox-body">
      <img id="lightbox-img" src="" alt="Foto">
      <p id="lightbox-caption"></p>
    </div>
    <button class="lightbox-nav lightbox-next" onclick="nextLightbox()">&#10095;</button>
  </div>`

  const toastMarkup = `<div id="toast-msg" class="toast-popup" style="display:none"></div>`

  const isDarkClass = t.isDark ? ' theme-dark' : ''
  const themeClass = `theme-${state.meta.theme_id}`
  const bodyScrollLock = state.meta.enable_cover ? ' lock-scroll' : ''

  function fmtDate(v) {
    if (!v) return ''
    const date = new Date(v)
    return Number.isNaN(date.getTime())
      ? ''
      : new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(date)
  }

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
    state.meta.title
  )}</title><meta name="description" content="${esc(x.hero.subtitle)}"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontUrl(
    font
  )}"><link rel="stylesheet" href="style.css"></head><body class="${themeClass}${isDarkClass}${bodyScrollLock}" style="--accent:${
    state.meta.primary_color
  };--font:'${font}',sans-serif;--bg-color:${state.meta.bg_color};--hero-gradient:${t.heroGradient};--border-color:${
    t.borderColor
  };--card-bg:${t.cardBg};--text-main:${t.textColor};--text-muted:${t.textMuted};${bgCss};font-family:'${font}',sans-serif">${coverMarkup}${
    blurCss ? `<div style="position:fixed;inset:0;${blurCss};z-index:0"></div>` : ''
  }${state.meta.particles !== 'none' ? `<canvas id="particles" style="position:fixed;inset:0;z-index:1;pointer-events:none"></canvas>` : ''}<div style="position:relative;z-index:2">${heroMarkup}<main>${
    active('event')
      ? `<section id="details"><p class="label">${esc(x.event.label)}</p><h2>${esc(
          fmtDate(x.event.date)
        )}</h2><p>${esc(x.event.venue)}<br>${esc(x.event.address)}</p>${calendarMarkup}</section>`
      : ''
  }${
    active('countdown')
      ? `<section><p class="label">${esc(x.countdown.label)}</p><div id="countdown" data-date="${esc(x.event.date)}"></div></section>`
      : ''
  }${storyMarkup}${
    active('gallery') ? `<section><h2>${esc(x.gallery.title)}</h2><div class="gallery">${photos}</div></section>` : ''
  }${rsvpMarkup}${guestbookMarkup}${giftMarkup}${
    active('faq')
      ? `<section><h2>${esc(x.faq.title)}</h2>${
          x.faq.dress ? `<p><strong>Dress code:</strong> ${esc(x.faq.dress)}</p>` : ''
        }${faqItems}</section>`
      : ''
  }${
    active('map')
      ? `<section><h2>${esc(x.map.title)}</h2>${
          mapUrl ? `<a href="${esc(mapUrl)}" target="_blank" rel="noopener">${esc(x.map.label)}</a>` : `<span>${esc(x.map.label)}</span>`
        }</section>`
      : ''
  }</main></div><button id="back-to-top" style="position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:99px;background:var(--accent);color:white;border:0;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;display:none;z-index:99;font-weight:700;font-size:13px" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑ Ke Atas</button>${
    song ? `<audio id="bg-audio" loop src="assets/${song}"></audio>` : ''
  }${lightboxMarkup}${toastMarkup}<script src="script.js"></${''}script></body></html>`
}

export function generateExportedCss(state) {
  const t = themeStylesMap[state.meta.theme_id] || themeStylesMap.romantic
  return `@import url('${fontUrl(state.meta.font_family)}');
*{box-sizing:border-box}
body{margin:0;font:17px/1.7 var(--font);color:${t.textColor};background:${state.meta.bg_color}}
body.lock-scroll{overflow:hidden}
body.theme-dark{background:${t.cardBg};color:#f8fafc}
.hero,section{padding:clamp(3rem,9vw,8rem) 1.5rem;text-align:center}
.hero{min-height:92vh;display:grid;place-content:center;background:var(--hero-gradient,${t.heroGradient})}
h1{font:clamp(3.5rem,12vw,8rem)/.95 var(--font);color:var(--accent);margin:.25em 0}
h2{font:clamp(2rem,6vw,4rem)/1 var(--font);color:var(--accent)}
section{max-width:900px;margin:auto;border-top:1px solid ${t.borderColor}}
.label{letter-spacing:.16em;font-size:.7rem;font-weight:700;color:var(--accent);text-transform:uppercase}
a,button{color:white;background:var(--accent);padding:.75rem 1.25rem;border:0;border-radius:99px;text-decoration:none;font:inherit;display:inline-block;font-weight:700;transition:transform .2s,box-shadow .2s}
a:hover,button:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.15)}
.calendar-btn{display:inline-flex;align-items:center;gap:.5rem;margin-top:1.2rem;background:transparent;border:2px solid var(--accent);color:var(--accent)}
.calendar-btn:hover{background:var(--accent);color:#fff}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}
.gallery-figure{margin:0;cursor:pointer;position:relative;overflow:hidden;border-radius:1rem}
.gallery-figure img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:1rem;transition:transform .3s;display:block}
.gallery-figure:hover img{transform:scale(1.05)}
.zoom-badge{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.65);color:#fff;font-size:11px;padding:3px 8px;border-radius:6px;backdrop-filter:blur(4px);pointer-events:none}
input,select,textarea{display:block;width:100%;padding:.7rem;margin:.3rem 0 1rem;border:1px solid #c9b9be;border-radius:.5rem;font:inherit}
body.theme-dark input,body.theme-dark select,body.theme-dark textarea{background:#1e293b;border-color:rgba(212,175,55,0.3);color:#f8fafc}
form{max-width:440px;margin:2rem auto;text-align:left}
#countdown{font-size:clamp(2rem,7vw,4rem);font-weight:700;color:var(--accent)}

/* Cover Envelope */
.envelope-cover{position:fixed;inset:0;z-index:9999;background:var(--hero-gradient,${t.heroGradient});display:grid;place-content:center;padding:1.5rem;transition:transform .8s cubic-bezier(0.16,1,0.3,1),opacity .8s;backdrop-filter:blur(10px)}
.envelope-cover.cover-opened{transform:translateY(-100%);pointer-events:none;opacity:0}
.envelope-card{background:rgba(255,255,255,.9);backdrop-filter:blur(16px);border:1px solid ${t.borderColor};border-radius:1.5rem;padding:3rem 2rem;text-align:center;max-width:440px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
body.theme-dark .envelope-card{background:rgba(15,23,42,.92);color:#f8fafc}
.cover-kicker{font-size:.72rem;letter-spacing:.18em;font-weight:700;color:var(--accent);text-transform:uppercase}
.cover-title{font-size:clamp(2rem,5vw,3rem);margin:.5rem 0;color:var(--accent);line-height:1.1}
.cover-divider{width:50px;height:2px;background:var(--accent);margin:1rem auto;opacity:.7}
.cover-subtitle{font-size:.9rem;color:#78666e;margin-bottom:.5rem}
body.theme-dark .cover-subtitle{color:#94a3b8}
.cover-guest-badge{background:rgba(0,0,0,.04);border:1px solid ${t.borderColor};border-radius:10px;padding:.75rem 1.25rem;margin:1rem 0 1.75rem;font-weight:700;font-size:1.15rem;color:var(--accent)}
body.theme-dark .cover-guest-badge{background:rgba(255,255,255,.05)}
.cover-open-btn{padding:.85rem 2rem;font-size:1rem;letter-spacing:.03em;box-shadow:0 10px 25px rgba(0,0,0,.18)}

/* Gift & QRIS */
.gift-card{background:rgba(255,255,255,.7);border:1px solid ${t.borderColor};border-radius:1rem;padding:1.5rem;max-width:420px;margin:1.5rem auto;text-align:center}
body.theme-dark .gift-card{background:rgba(30,41,59,.7)}
.bank-tag{font-size:.68rem;letter-spacing:.12em;font-weight:700;color:var(--accent);display:block}
.acc-num{font-size:1.6rem;letter-spacing:.05em;color:var(--accent);display:block;margin:.25rem 0}
.acc-holder{font-size:.9rem;margin:0 0 1rem;opacity:.8}
.copy-acc-btn{font-size:.85rem;padding:.6rem 1.2rem}
.qris-card{margin:1.5rem auto;max-width:320px;text-align:center}
.qris-title{font-size:.85rem;font-weight:700;margin-bottom:.5rem}
.qris-img{max-width:240px;width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:#fff;padding:8px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08)}

/* RSVP & Guestbook */
.rsvp-btn-row{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem}
.wa-btn{background:#25d366}
.wa-btn:hover{background:#20bd5a}
.guestbook-list{margin-top:2rem;display:flex;flex-direction:column;gap:1rem;text-align:left}
.wish-card{background:rgba(255,255,255,.6);border:1px solid ${t.borderColor};border-radius:1rem;padding:1rem 1.25rem}
body.theme-dark .wish-card{background:rgba(30,41,59,.6)}
.wish-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem}
.wish-header strong{font-size:.92rem}
.wish-time{font-size:.72rem;color:#888}
.wish-body{font-size:.88rem;margin:0}

/* Lightbox Modal */
.lightbox-overlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:1.5rem}
.lightbox-body{max-width:90vw;max-height:85vh;text-align:center}
.lightbox-body img{max-width:100%;max-height:75vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5);object-fit:contain}
.lightbox-close{position:absolute;top:20px;right:25px;background:transparent;border:0;font-size:36px;color:#fff;cursor:pointer}
.lightbox-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:0;color:#fff;font-size:24px;width:44px;height:44px;border-radius:50%;cursor:pointer}
.lightbox-prev{left:20px}
.lightbox-next{right:20px}
#lightbox-caption{color:#e2e8f0;margin-top:.75rem;font-size:.9rem}

/* Toast popup */
.toast-popup{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:.75rem 1.4rem;border-radius:99px;font-size:.85rem;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.3);z-index:10001;border:1px solid rgba(255,255,255,.15)}

/* Hero Layouts */
.hero-monogram .monogram-badge{width:90px;height:90px;border-radius:50%;border:2px solid var(--accent);display:grid;place-content:center;margin:0 auto 1.5rem;font-size:1.6rem;font-weight:700;color:var(--accent)}
.hero-split .split-pill-badge{display:inline-block;border:1px solid var(--accent);color:var(--accent);padding:.4rem 1.2rem;border-radius:99px;font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:1rem}
.hero-split .split-divider{width:60px;height:3px;background:var(--accent);margin:1.2rem auto;border-radius:99px}
.hero-minimal .minimal-rule{display:flex;align-items:center;gap:1rem;max-width:320px;margin:0 auto .75rem}
.hero-minimal .minimal-rule span{flex:1;height:1px;background:${t.borderColor}}
.hero-minimal .minimal-sub{font-style:italic}
.hero-minimal .minimal-btn{background:transparent;border:1.5px solid var(--accent);color:var(--accent)}
.hero-minimal .minimal-btn:hover{background:var(--accent);color:#fff}

/* Story Timeline */
.story-timeline{position:relative;max-width:540px;margin:2rem auto 0;text-align:left}
.timeline-item{display:flex;gap:1.25rem;position:relative;padding-bottom:1.75rem}
.timeline-marker{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:24px;position:relative}
.timeline-dot{width:16px;height:16px;border-radius:50%;background:var(--accent);border:3px solid #fff;box-shadow:0 0 0 2px var(--accent);z-index:2;margin-top:4px}
.timeline-line{position:absolute;top:20px;bottom:-4px;width:2px;background:var(--accent);opacity:.4}
.timeline-content{flex:1;background:rgba(255,255,255,.6);border:1px solid ${t.borderColor};border-radius:1rem;padding:.9rem 1.2rem}
body.theme-dark .timeline-content{background:rgba(30,41,59,.7)}
.timeline-year-badge{display:inline-block;padding:.2rem .65rem;border-radius:999px;background:var(--accent);color:#fff;font-size:.72rem;font-weight:700;margin-bottom:.35rem}
.timeline-title{font-size:1.05rem;font-weight:700;margin:.2rem 0 .4rem}
.timeline-desc{margin:0;font-size:.88rem;opacity:.85}

/* Scroll reveal animations (DEV-03) */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}
.reveal-on-scroll.is-revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}`
}

export function generateStandaloneScript(state, particleCfg) {
  const particleScript =
    state.meta.particles !== 'none'
      ? `
;(function(){
  const canvas=document.getElementById('particles');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};resize();addEventListener('resize',resize);
  const type='${state.meta.particles}',speed=${particleCfg.speed},count=${particleCfg.count};
  const ps=[];for(let i=0;i<count;i++)ps.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*4+2,sx:(Math.random()-.5)*speed,sy:Math.random()*speed+.3,o:Math.random()*.7+.3,r:Math.random()*360,rs:(Math.random()-.5)*2});
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);for(const p of ps){p.x+=p.sx;p.y+=p.sy;p.r+=p.rs;if(p.y>canvas.height+10){p.y=-10;p.x=Math.random()*canvas.width}if(p.x>canvas.width+10)p.x=-10;if(p.x<-10)p.x=canvas.width+10;
  if(type==='snow'){ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+p.o+')';ctx.fill()}
  else if(type==='love'){const s=p.size*1.5;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.beginPath();ctx.moveTo(0,-s*.3);ctx.bezierCurveTo(s*.5,-s,s,-s*.4,0,s*.6);ctx.bezierCurveTo(-s,-s*.4,-s*.5,-s,0,-s*.3);ctx.fillStyle='rgba(220,60,100,'+p.o+')';ctx.fill();ctx.restore()}
  else if(type==='confetti'){const colors=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff78ae','#a855f7'];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.fillStyle=colors[Math.floor(p.o*colors.length)%colors.length];ctx.globalAlpha=p.o;ctx.fillRect(-p.size,-p.size*.4,p.size*2,p.size*.8);ctx.restore()}
  else if(type==='stars'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r*Math.PI/180);ctx.beginPath();for(let i=0;i<5;i++){const a=i*4*Math.PI/5-Math.PI/2;ctx[i?'lineTo':'moveTo'](Math.cos(a)*p.size,Math.sin(a)*p.size)}ctx.closePath();ctx.fillStyle='rgba(255,215,0,'+p.o+')';ctx.fill();ctx.restore()}}
  requestAnimationFrame(draw)}draw()
})();`
      : ''

  return `// Digital Greeting Standalone Script
// Read URL query parameter ?to=... for personalized guest greeting (FTR-02)
const urlParams = new URLSearchParams(window.location.search);
const toName = urlParams.get('to');
if (toName) {
  const gName = document.getElementById('cover-guest-name');
  if (gName) gName.textContent = toName;
  const rName = document.querySelector('input[name="name"]');
  if (rName) rName.value = toName;
  const wName = document.querySelector('input[name="wish_name"]');
  if (wName) wName.value = toName;
}

// Cover "Buka Undangan" (FTR-01)
const btnOpen = document.getElementById('btn-open-envelope');
const coverEl = document.getElementById('envelope-cover');
const bgAudio = document.getElementById('bg-audio');
if (btnOpen && coverEl) {
  btnOpen.addEventListener('click', () => {
    coverEl.classList.add('cover-opened');
    document.body.classList.remove('lock-scroll');
    if (bgAudio) { bgAudio.play().catch(()=>{}); }
  });
}

// Countdown
const c = document.querySelector('#countdown');
if (c) {
  setInterval(() => {
    let d = Math.max(0, new Date(c.dataset.date) - Date.now());
    c.textContent = Math.floor(d / 864e5) + ' hari ' + Math.floor(d / 36e5) % 24 + ' jam ' + Math.floor(d / 6e4) % 60 + ' m ' + Math.floor(d / 1e3) % 60 + ' s';
  }, 1000);
}

// Toast notification
function showToast(txt) {
  const t = document.getElementById('toast-msg');
  if (!t) return;
  t.textContent = txt;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2600);
}

// Salin nomor rekening (FTR-03)
window.copyGiftAcc = function(acc) {
  navigator.clipboard.writeText(acc).then(() => {
    showToast('✅ Nomor rekening berhasil disalin!');
  }).catch(() => {
    showToast('✅ Tersalin: ' + acc);
  });
};

// WhatsApp RSVP submission (FTR-05)
window.sendRsvpWhatsApp = function() {
  const form = document.getElementById('rsvp');
  if (!form) return;
  const name = form.name.value.trim() || 'Tamu Undangan';
  const att = form.attendance.value;
  const pax = form.pax.value;
  const notes = form.notes.value.trim();
  const wa = '${esc(state.sections.rsvp.wa_number || '').replace(/\D/g, '')}';
  const title = '${esc(state.sections.hero.title || state.meta.title)}';
  const text = 'Halo! Konfirmasi kehadiran untuk *' + title + '*:%0A- Nama: *' + encodeURIComponent(name) + '*%0A- Status: *' + encodeURIComponent(att) + ' (' + encodeURIComponent(pax) + ')*%0A- Ucapan: ' + encodeURIComponent(notes || '-');
  const link = wa ? 'https://wa.me/' + wa + '?text=' + text : 'https://api.whatsapp.com/send?text=' + text;
  window.open(link, '_blank');
};

window.submitRsvpForm = function(e) {
  e.preventDefault();
  const rep = document.getElementById('reply');
  if (rep) rep.textContent = 'Terima kasih atas konfirmasi kehadiranmu! Data telah tercatat.';
  showToast('✅ Konfirmasi kehadiran tersimpan');
};

// Lightbox Galeri (FTR-06)
const galleryFigures = Array.from(document.querySelectorAll('.gallery-figure img'));
const galleryData = galleryFigures.map(img => ({ src: img.src, alt: img.alt }));
let curLbIdx = 0;

window.openLightbox = function(i) {
  curLbIdx = i;
  updateLightbox();
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'flex';
};
window.closeLightbox = function() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
};
window.nextLightbox = function() {
  if (!galleryData.length) return;
  curLbIdx = (curLbIdx + 1) % galleryData.length;
  updateLightbox();
};
window.prevLightbox = function() {
  if (!galleryData.length) return;
  curLbIdx = (curLbIdx - 1 + galleryData.length) % galleryData.length;
  updateLightbox();
};
function updateLightbox() {
  const item = galleryData[curLbIdx];
  if (!item) return;
  const imgEl = document.getElementById('lightbox-img');
  const capEl = document.getElementById('lightbox-caption');
  if (imgEl) imgEl.src = item.src;
  if (capEl) capEl.textContent = item.alt || '';
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || lb.style.display === 'none') return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextLightbox();
  if (e.key === 'ArrowLeft') prevLightbox();
});

// Guestbook (Buku Tamu) (FTR-07)
const GB_KEY = 'greeting_wishes_${state.id}';
window.submitGuestbook = function(e) {
  e.preventDefault();
  const form = document.getElementById('guestbook-form');
  const name = form.wish_name.value.trim();
  const msg = form.wish_msg.value.trim();
  if (!name || !msg) return;
  const wish = { name, message: msg, date: 'Baru saja' };
  
  let savedWishes = [];
  try { savedWishes = JSON.parse(localStorage.getItem(GB_KEY) || '[]'); } catch(err){}
  savedWishes.unshift(wish);
  try { localStorage.setItem(GB_KEY, JSON.stringify(savedWishes)); } catch(err){}

  const list = document.getElementById('guestbook-list');
  if (list) {
    const card = document.createElement('div');
    card.className = 'wish-card';
    card.innerHTML = '<div class="wish-header"><strong>' + name + '</strong><span class="wish-time">Baru saja</span></div><p class="wish-body">' + msg + '</p>';
    list.prepend(card);
  }
  form.wish_msg.value = '';
  showToast('✨ Doa & ucapan berhasil dikirim!');
};

// Load saved wishes from localStorage
try {
  const savedWishes = JSON.parse(localStorage.getItem(GB_KEY) || '[]');
  const list = document.getElementById('guestbook-list');
  if (list && savedWishes.length) {
    savedWishes.forEach(w => {
      const card = document.createElement('div');
      card.className = 'wish-card';
      card.innerHTML = '<div class="wish-header"><strong>' + w.name + '</strong><span class="wish-time">' + (w.date || 'Terkirim') + '</span></div><p class="wish-body">' + w.message + '</p>';
      list.appendChild(card);
    });
  }
} catch(err){}

// Scroll to top
const b = document.getElementById('back-to-top');
if (b) {
  window.addEventListener('scroll', () => {
    b.style.display = window.scrollY > 250 ? 'block' : 'none';
  });
}

// Scroll reveal animations (DEV-03)
;(function() {
  const revealElements = document.querySelectorAll('section, header.hero, .block, .wish-card, .gift-card, .qris-card, form#rsvp, form#guestbook-form');
  revealElements.forEach(el => el.classList.add('reveal-on-scroll'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }
})();
${particleScript}`
}

export async function exportZipPackage(state, particleCfg, monogramInitials) {
  const zip = new JSZip()
  const imgs = Array(state.gallery.length).fill('')

  for (const [i, p] of state.gallery.entries()) {
    if (!(p.file_blob instanceof Blob)) continue
    const n = fileName(p.file_name, `gallery-${i + 1}`)
    imgs[i] = n
    zip.file(`assets/${n}`, await p.file_blob.arrayBuffer())
  }

  let song = ''
  if (state.music.file_blob instanceof Blob) {
    song = fileName(state.music.file_name, 'bg-music')
    zip.file(`assets/${song}`, await state.music.file_blob.arrayBuffer())
  }

  let bgImg = ''
  if (state.meta.bg_image instanceof Blob) {
    bgImg = fileName(state.meta.bg_image_name, 'bg-image')
    zip.file(`assets/${bgImg}`, await state.meta.bg_image.arrayBuffer())
  }

  let qrisImg = ''
  if (state.sections.gift?.qris_image instanceof Blob) {
    qrisImg = fileName(state.sections.gift.qris_image_name || 'qris.png', 'qris')
    zip.file(`assets/${qrisImg}`, await state.sections.gift.qris_image.arrayBuffer())
  }

  const html = generateExportedHtml(state, imgs, song, bgImg, qrisImg, monogramInitials)
  const css = generateExportedCss(state)
  const js = generateStandaloneScript(state, particleCfg)

  zip.file('index.html', html)
  zip.file('style.css', css)
  zip.file('script.js', js)

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, 'generated-greeting.zip')
}
