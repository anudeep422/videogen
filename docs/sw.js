/* VideoGen offline helper.
   Pages and code: try the internet first (so updates show at once), fall back to the saved copy when offline.
   Sounds, fonts, pictures and libraries: use the saved copy first (they rarely change), save new ones as they are used. */
const CODE = 'vg-code-v1', MEDIA = 'vg-media-v1';
const START = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png',
  './animate/', './animate/index.html', './studio/', './studio/index.html', './studio/engine.js', './studio/samples/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CODE).then(c => c.addAll(START).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CODE && k !== MEDIA).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET') return;
  const url = new URL(req.url); if(url.origin !== location.origin) return;
  const media = /\.(mp3|wav|m4a|ttf|woff2?|png|jpg|jpeg|webp|svg)$/i.test(url.pathname) || /\/lib\//.test(url.pathname);
  if(media){
    e.respondWith(caches.open(MEDIA).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if(r.ok) c.put(req, r.clone()); return r; }))));
  } else {
    e.respondWith(fetch(req).then(r => { if(r.ok){ const cp = r.clone(); caches.open(CODE).then(c => c.put(req, cp)); } return r; }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
  }
});
