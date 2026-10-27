// שומר עותק של התוכנה בקופסה, כדי שהמסך ימשיך לעבוד גם בלי אינטרנט.
// תמיד מנסה קודם את הגרסה העדכנית מהאינטרנט, ואם אין – משתמש בעותק השמור.
const CACHE = 'meron-app-v1';
const CORE = [
  './', 'index.html', 'settings.js', 'zmanim.js',
  'fonts/heebo-hebrew-300-normal.woff2', 'fonts/heebo-hebrew-400-normal.woff2',
  'fonts/heebo-hebrew-500-normal.woff2', 'fonts/heebo-hebrew-700-normal.woff2',
  'fonts/heebo-latin-300-normal.woff2', 'fonts/heebo-latin-400-normal.woff2',
  'fonts/heebo-latin-500-normal.woff2', 'fonts/heebo-latin-700-normal.woff2',
  'fonts/frank-ruhl-libre-hebrew-500-normal.woff2', 'fonts/frank-ruhl-libre-hebrew-700-normal.woff2',
  'fonts/frank-ruhl-libre-hebrew-900-normal.woff2', 'fonts/frank-ruhl-libre-latin-700-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // סרטונים נשמרים בנפרד על ידי הדף עצמו
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/video/')) return;
  const key = url.origin + url.pathname;  // בלי פרמטרים
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key).then(r => r || caches.match(new URL('index.html', self.registration.scope).href)))
  );
});
