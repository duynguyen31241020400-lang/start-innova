// Build site tĩnh cho SIV. Không cần cài thư viện, chỉ cần Node 18 trở lên.
// Chạy: node build.mjs   ->   kết quả nằm trong thư mục dist/
// Khung trang và màu sắc bám theo website Adxchange.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const C = (...p) => join(ROOT, 'content', ...p);

const readJSON = (f) => JSON.parse(readFileSync(f, 'utf8'));
const listJSON = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJSON(join(dir, f))) : [];

// ---------- Nội dung ----------
const site = readJSON(C('site.json'));
const hero = readJSON(C('hero.json'));
const veSiv = readJSON(C('ve-siv.json'));
const tuyen = readJSON(C('tuyen.json'));
const stats = readJSON(C('stats.json')).items || [];
const faq = (readJSON(C('faq.json')).items || []).filter((x) => x.q && x.a);
const phongBan = listJSON(C('phong-ban')).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
const duAn = listJSON(C('du-an'))
  .filter((d) => d.published !== false && d.slug && d.title)
  .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
const partners = listJSON(C('doi-tac')).filter((p) => p.name && p.logo);

// Hạng đối tác, theo thứ tự hiển thị (hạng đầu hiển thị to nhất)
const TIERS = [
  'Đơn vị tổ chức',
  'Đối tác chiến lược',
  'Đối tác dự án',
  'Nhà tài trợ Vàng',
  'Nhà tài trợ Đồng',
  'Đối tác truyền thông',
];

const contact = site.contact || {};
const hasPartners = partners.length > 0;
const hasProjects = duAn.length > 0;
const recruiting = tuyen.enabled === true;
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- Tiện ích ----------
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const emph = (s = '') => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>'); // *chữ* -> khung trắng chữ xanh
const paras = (t = '') =>
  String(t)
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
const num = (i) => String(i + 1).padStart(2, '0');
const fmtDate = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};
const abs = (p) => (/^https?:/.test(p) ? p : site.url + p);
const ext = (href) => `href="${esc(href)}" target="_blank" rel="noopener"`;
const isExternal = (h) => /^https?:/.test(h);
const linkAttr = (h) => (isExternal(h) ? ext(h) : `href="${esc(h)}"`);

// ---------- Khung trang ----------
const nav = [
  ['Trang chủ', '/'],
  ['Về SIV', '/ve-siv/'],
  ['Phòng ban', '/phong-ban/'],
  ...(hasProjects ? [['Dự án', '/du-an/']] : []),
  ...(hasPartners ? [['Đối tác', '/doi-tac/']] : []),
  ['Liên hệ', '/lien-he/'],
];
const isOn = (href, path) => (href === '/' ? path === '/' : path.startsWith(href));

const headerCta = recruiting ? ['Ứng tuyển', '/tuyen-thanh-vien/'] : ['Liên hệ', '/lien-he/'];

function header(path) {
  const links = nav.map(([l, h]) => `<a class="${isOn(h, path) ? 'on' : ''}" href="${h}">${l}</a>`).join('');
  return `<a class="skip-link" href="#content">Bỏ qua, tới nội dung</a>
<a class="logo-fixed" href="/" aria-label="${esc(site.name)} – trang chủ"><img src="/images/logo-icon.png" width="46" height="46" alt=""></a>
<header class="adx-h">
  <span></span>
  <nav aria-label="Menu chính">${links}</nav>
  <div class="hr">
    <a class="hcta" href="${headerCta[1]}">${headerCta[0]}</a>
    <button class="burger" id="burger" aria-label="Mở menu" aria-expanded="false" aria-controls="nav-mobile"><span></span><span></span></button>
  </div>
</header>
<nav class="nav-mobile" id="nav-mobile" aria-label="Menu di động">${links}${
    recruiting ? '<a href="/tuyen-thanh-vien/">Ứng tuyển</a>' : ''
  }</nav>`;
}

function contactItems() {
  const items = [];
  if (contact.fanpage) items.push(['Fanpage', `<a ${ext(contact.fanpage)}>SIV – StartInnova Club</a>`]);
  if (contact.email) items.push(['Email', `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`]);
  if (contact.phone) items.push(['Điện thoại', `<a href="tel:${esc(contact.phone.replace(/\s/g, ''))}">${esc(contact.phone)}</a>`]);
  if (contact.address) items.push(['Địa chỉ', esc(contact.address)]);
  for (const [k, label] of [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn']]) {
    if (contact[k]) items.push([label, `<a ${ext(contact[k])}>${label}</a>`]);
  }
  items.push(['Website', `<a href="${esc(site.url)}">${esc(site.url.replace(/^https?:\/\//, ''))}</a>`]);
  return items;
}

function footer() {
  const items = contactItems();
  return `<footer class="adx-f">
  <div>
    <h4>Menu</h4>
    <ul>${nav.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}${
      recruiting ? '<li><a href="/tuyen-thanh-vien/">Tuyển thành viên</a></li>' : ''
    }</ul>
  </div>
  <div>
    <h4>Phòng ban</h4>
    <ul>${phongBan.map((d) => `<li><a href="/phong-ban/${esc(d.slug)}/">${esc(d.name)}</a></li>`).join('')}</ul>
  </div>
  <div>
    <h4>Liên hệ</h4>
    <ul>${items.map(([l, v]) => `<li>${l}: ${v}</li>`).join('')}</ul>
  </div>
  <div>
    <h4>Trực thuộc</h4>
    <ul><li>${esc(site.org)}</li></ul>
  </div>
  <div class="bigmark"><img src="/images/logo-icon.png" width="260" height="256" alt="${esc(site.name)}" loading="lazy"></div>
  <div class="copy">© ${YEAR} ${esc(site.name)} – ${esc(site.org)}</div>
</footer>`;
}

// ---------- CTA nền xanh ----------
function ctaSection() {
  const href = recruiting ? '/tuyen-thanh-vien/' : '/lien-he/';
  const row = [];
  if (recruiting) row.push(`<a href="/tuyen-thanh-vien/">Ứng tuyển</a>`);
  if (contact.email) row.push(`<a href="mailto:${esc(contact.email)}">Email</a>`);
  if (contact.fanpage) row.push(`<a ${ext(contact.fanpage)}>Fanpage</a>`);
  if (contact.phone) row.push(`<a href="tel:${esc(contact.phone.replace(/\s/g, ''))}">Gọi điện</a>`);
  row.push(`<a href="/phong-ban/">Phòng ban</a>`);
  return `<section class="full cta" id="lien-he">
  <a class="t" href="${href}">${esc(hero.cta)}</a>
  <div class="row">${row.join('')}</div>
</section>`;
}

const pages = []; // { url, html, index, file }

function addPage({ path, title, desc, body, og, jsonld, index = true, file, cta = true }) {
  const fullTitle = path === '/' ? title : `${title} | ${site.name} (${site.shortName})`;
  const description = desc || site.description;
  const canonical = abs(path);
  const image = abs(og || hero.slides[0].image);
  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${index ? '' : '<meta name="robots" content="noindex">\n'}<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0c">
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/css/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
${header(path)}
<main id="content">
${body}
${cta ? ctaSection() : ''}
</main>
${footer()}
<script src="/js/main.js" defer></script>
</body>
</html>`;
  pages.push({ url: path, html, index, file: file || join(path, 'index.html') });
}

// ---------- Khối dùng lại ----------
const phero = (title, lead, crumbs = []) => `<section class="phero">
  <p class="tag"><a href="/">Trang chủ</a>${crumbs.map(([l, h]) => ` / <a href="${h}">${esc(l)}</a>`).join('')}</p>
  <h1>${esc(title)}</h1>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
</section>`;

// Hàng đánh số kiểu "dịch vụ": số nhỏ | tiêu đề | mô tả (hover đổ xanh)
const row = (i, title, text, href) =>
  href
    ? `<a ${linkAttr(href)}><small>${num(i)}</small><h4>${esc(title)}</h4><p>${esc(text)}</p></a>`
    : `<div><small>${num(i)}</small><h4>${esc(title)}</h4><p>${esc(text)}</p></div>`;

const plainRow = (i, text) => `<div><small>${num(i)}</small><p>${esc(text)}</p></div>`;

const projectCard = (p, i, total) => `<a class="card${i === 0 && total % 2 === 1 ? ' wide' : ''}" href="/du-an/${esc(p.slug)}/">
  ${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.coverAlt || p.title)}" loading="lazy">` : ''}
  <span class="go">↗</span>
  <div class="meta">
    ${p.date || p.time ? `<small>${esc(p.time || fmtDate(p.date))}</small>` : ''}
    <div class="h">${esc(p.title)}</div>
    ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
  </div>
</a>`;

const logoInner = (p) => {
  const img = `<img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy">`;
  return p.url ? `<a class="mq-i" ${ext(p.url)} title="${esc(p.name)}">${img}</a>` : `<span class="mq-i" title="${esc(p.name)}">${img}</span>`;
};

// ---------- Trang chủ ----------
function homePage() {
  const media = hero.video
    ? `<video src="${esc(hero.video)}" autoplay muted loop playsinline></video>`
    : '';

  const pillars = hero.slides
    .map(
      (s) => `<section class="full pillar img">
  <picture><img src="${esc(s.image)}" alt="${esc(s.alt || '')}" style="object-position:${esc(s.position || "50% 50%")}"></picture>
  <h3>${esc(s.word)}</h3>
  <p>${esc(s.caption)}</p>
</section>`
    )
    .join('\n');

  const body = `<section class="full hero" id="home">
  ${media}
  <div class="tag">${esc(hero.tag)}</div>
  <h2>${esc(hero.word)}</h2>
  <a class="pill" href="#ve-siv">♥ Khám phá</a>
</section>

<section class="full statement" id="ve-siv">
  <div>
    <p>${emph(hero.statement)}</p>
    <a class="s-link" href="/ve-siv/">Tìm hiểu về SIV →</a>
  </div>
</section>
${
  stats.length
    ? `<section class="stats" style="grid-template-columns:repeat(${stats.length},1fr)">${stats
        .map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`)
        .join('')}</section>`
    : ''
}
${pillars}

<section class="sec" id="truc-cot">
  <h2>Định hướng công nghệ</h2>
  <p class="intro">${esc(veSiv.techIntro)}</p>
  <div class="svc">${veSiv.pillars.map((p, i) => row(i, p.title, p.text)).join('')}</div>
</section>

<section class="sec sec-tint" id="phong-ban">
  <h2>Phòng ban</h2>
  <div class="svc">${phongBan.map((d, i) => row(i, d.name, d.short, `/phong-ban/${d.slug}/`)).join('')}</div>
</section>
${
  hasProjects
    ? `<section class="sec work" id="du-an">
  <h2>Dự án</h2>
  <div class="cards">${duAn.slice(0, 5).map((p, i, a) => projectCard(p, i, a.length)).join('')}</div>
  <a class="all" href="/du-an/">Xem tất cả dự án →</a>
</section>`
    : ''
}${
  hasPartners
    ? `<section class="clients">
  <h3>Đồng hành cùng SIV</h3>
  <div class="mq"><div class="mq-t">${[...partners, ...partners].map(logoInner).join('')}</div></div>
</section>`
    : ''
}
<section class="sec">
  <div class="about">
    <div class="l">
      <h2>Về SIV</h2>
      <p>${esc(veSiv.intro[0])}</p>
      <a class="s-link dark" href="/ve-siv/">Xem đầy đủ →</a>
    </div>
    <div class="vm">
      <div><h5>Tầm nhìn</h5><p>${esc(veSiv.vision)}</p></div>
      <div><h5>Sứ mệnh</h5><p>${esc(veSiv.missionShort)}</p></div>
      <div><h5>Tinh thần</h5><p>${esc(site.tagline)}</p></div>
    </div>
  </div>
</section>
${
  faq.length
    ? `<section class="sec faq">
  <h2>Câu hỏi thường gặp</h2>
  ${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
</section>`
    : ''
}`;

  const sameAs = ['fanpage', 'instagram', 'tiktok', 'linkedin'].map((k) => contact[k]).filter(Boolean);
  addPage({
    path: '/',
    title: `${site.name} (${site.shortName}) – ${site.tagline} | UEH.ISB`,
    desc: site.description,
    body,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      alternateName: [site.shortName, 'StartInnova'],
      url: site.url,
      logo: abs('/images/logo-icon.png'),
      description: site.description,
      parentOrganization: { '@type': 'CollegeOrUniversity', name: 'Trường Tài năng UEH.ISB – Đại học Kinh tế TP. Hồ Chí Minh' },
      ...(sameAs.length ? { sameAs } : {}),
    },
  });
}

// ---------- Về SIV ----------
function veSivPage() {
  addPage({
    path: '/ve-siv/',
    title: 'Về SIV',
    desc: 'Tầm nhìn, sứ mệnh và định hướng công nghệ của StartInnova Club (SIV) – CLB khởi nghiệp công nghệ thuộc Trường Tài năng UEH.ISB.',
    body: `${phero('Về SIV', site.tagline)}
<section class="sec">
  <div class="about">
    <div class="l">${veSiv.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    <div class="vm">
      <div><h5>Tầm nhìn</h5><p>${esc(veSiv.vision)}</p></div>
      <div><h5>Tinh thần</h5><p>${esc(veSiv.spirit)}</p></div>
    </div>
  </div>
</section>
<section class="sec sec-tint">
  <h2>Sứ mệnh</h2>
  <p class="intro">${esc(veSiv.missionIntro)}</p>
  <div class="svc plain">${veSiv.mission.map((m, i) => plainRow(i, m)).join('')}</div>
</section>
<section class="sec">
  <h2>Định hướng công nghệ</h2>
  <p class="intro">${esc(veSiv.techIntro)}</p>
  <div class="svc">${veSiv.pillars.map((p, i) => row(i, p.title, p.text)).join('')}</div>
</section>`,
  });
}

// ---------- Phòng ban ----------
function phongBanPages() {
  addPage({
    path: '/phong-ban/',
    title: 'Phòng ban',
    desc: 'Bốn ban của StartInnova Club: Operation, Marketing, R&D và External Relations.',
    body: `${phero('Phòng ban', 'Bốn ban, một đội ngũ cùng bứt phá.')}
<section class="sec"><div class="svc">${phongBan.map((d, i) => row(i, d.name, d.short, `/phong-ban/${d.slug}/`)).join('')}</div></section>`,
  });

  for (const d of phongBan) {
    const hiring = recruiting && d.jdUrl;
    const others = phongBan.filter((x) => x.slug !== d.slug);
    addPage({
      path: `/phong-ban/${d.slug}/`,
      title: `Ban ${d.name}`,
      desc: `${d.short} ${d.role}`.slice(0, 300),
      body: `${phero(`Ban ${d.name}`, d.short, [['Phòng ban', '/phong-ban/']])}
<section class="sec">
  <div class="about">
    <div class="l"><p>${esc(d.role)}</p></div>
    <div class="vm"><div><h5>Phạm vi công việc</h5></div></div>
  </div>
  <div class="svc plain" style="margin-top:6vh">${(d.scope || []).map((s, i) => plainRow(i, s)).join('')}</div>
</section>
${
  hiring
    ? `<section class="sec sec-tint"><h2>Đang tuyển</h2>
  <div class="svc">
    ${row(0, `Gia nhập Ban ${d.name}`, 'Xem mô tả công việc của ban.', d.jdUrl)}
    ${tuyen.formUrl ? row(1, 'Ứng tuyển ngay', 'Điền form ứng tuyển.', tuyen.formUrl) : ''}
  </div></section>`
    : ''
}
<section class="sec ${hiring ? '' : 'sec-tint'}"><h2>Các ban khác</h2>
  <div class="svc">${others.map((o) => row(phongBan.indexOf(o), o.name, o.short, `/phong-ban/${o.slug}/`)).join('')}</div>
</section>`,
    });
  }
}

// ---------- Dự án (chỉ tạo khi có dữ liệu) ----------
function duAnPages() {
  if (!hasProjects) return;
  addPage({
    path: '/du-an/',
    title: 'Dự án',
    desc: 'Các dự án và hoạt động của StartInnova Club.',
    body: `${phero('Dự án', 'Những hoạt động SIV đã và đang thực hiện.')}
<section class="sec work"><div class="cards">${duAn.map((p, i, a) => projectCard(p, i, a.length)).join('')}</div></section>`,
  });
  for (const p of duAn) {
    const gallery = (p.gallery || []).filter((g) => g.image);
    addPage({
      path: `/du-an/${p.slug}/`,
      title: p.seoTitle || p.title,
      desc: p.seoDescription || p.summary,
      og: p.cover,
      body: `${phero(p.title, p.summary, [['Dự án', '/du-an/']])}
${p.cover ? `<figure class="cover"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt || p.title)}"></figure>` : ''}
<section class="sec">
  <div class="prose">
    ${p.date || p.time ? `<small class="meta-line">${esc(p.time || fmtDate(p.date))}</small>` : ''}
    ${paras(p.body)}
  </div>
  ${gallery.length ? `<div class="gallery">${gallery.map((g) => `<figure><img src="${esc(g.image)}" alt="${esc(g.alt || p.title)}" loading="lazy"></figure>`).join('')}</div>` : ''}
  <a class="s-link dark" href="/du-an/">← Tất cả dự án</a>
</section>`,
    });
  }
}

// ---------- Đối tác (chỉ tạo khi có dữ liệu) ----------
function doiTacPage() {
  if (!hasPartners) return;
  const groups = TIERS.map((t, ti) => ({ t, ti, list: partners.filter((p) => p.tier === t) })).filter((g) => g.list.length);
  const rest = partners.filter((p) => !TIERS.includes(p.tier));
  if (rest.length) groups.push({ t: 'Đối tác khác', ti: 9, list: rest });
  addPage({
    path: '/doi-tac/',
    title: 'Đối tác',
    desc: 'Các đơn vị đồng hành, tài trợ và hỗ trợ truyền thông cho StartInnova Club.',
    body: `${phero('Đối tác', 'Những đơn vị đồng hành cùng SIV.')}
<section class="sec">
${groups
  .map(
    (g) => `<div class="tier t${Math.min(g.ti, 3)}"><h3>${esc(g.t)}</h3><div class="tier-logos">${g.list.map(logoInner).join('')}</div></div>`
  )
  .join('')}
</section>`,
  });
}

// ---------- Tuyển thành viên (chỉ tạo khi bật) ----------
function tuyenPage() {
  if (!recruiting) return;
  addPage({
    path: '/tuyen-thanh-vien/',
    title: tuyen.title || 'Tuyển thành viên',
    desc: tuyen.intro || 'Gia nhập StartInnova Club cùng bứt phá trên hành trình khởi nghiệp công nghệ.',
    body: `${phero(tuyen.title || 'Tuyển thành viên', tuyen.intro)}
<section class="sec">
  <div class="svc">${phongBan
    .map((d, i) => row(i, `Ban ${d.name}`, d.short, d.jdUrl || `/phong-ban/${d.slug}/`))
    .join('')}</div>
  ${tuyen.formUrl ? `<a class="all dark" ${ext(tuyen.formUrl)}>Ứng tuyển ngay →</a>` : ''}
</section>`,
  });
}

// ---------- Liên hệ ----------
function lienHePage() {
  const items = contactItems();
  addPage({
    path: '/lien-he/',
    title: 'Liên hệ',
    desc: 'Thông tin liên hệ StartInnova Club (SIV) – Trường Tài năng UEH.ISB.',
    cta: false,
    body: `${phero('Liên hệ', site.org)}
<section class="sec"><div class="svc contact">${items
      .map(([l, v], i) => `<div><small>${num(i)}</small><h4>${l}</h4><p>${v}</p></div>`)
      .join('')}</div></section>`,
  });
}

function notFoundPage() {
  addPage({
    path: '/404.html',
    file: '404.html',
    title: 'Không tìm thấy trang',
    desc: 'Trang bạn tìm không tồn tại.',
    index: false,
    cta: false,
    body: `<section class="full statement"><div><p>Trang bạn tìm <em>không tồn tại</em>.</p><a class="s-link" href="/">Về trang chủ →</a></div></section>`,
  });
}

// ---------- Chạy ----------
homePage();
veSivPage();
phongBanPages();
duAnPages();
doiTacPage();
tuyenPage();
lienHePage();
notFoundPage();

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'public'), DIST, { recursive: true });

for (const p of pages) {
  const f = join(DIST, p.file);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, p.html);
}

const urls = pages.filter((p) => p.index);
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((p) => `  <url><loc>${abs(p.url)}</loc><lastmod>${TODAY}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Đã build ${pages.length} trang -> dist/`);
for (const p of pages) console.log('  ', p.url);
