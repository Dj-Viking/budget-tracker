const PATHS_TO_CACHE = [
  './',
  './manifest.json',
  './css/styles.css',
  './index.html',
  './js/index.js',
  './js/idb.js',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
];
const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'v1';
const CACHE_NAME = APP_PREFIX + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(
      (cache) => {
        console.log('installing cache : ' + CACHE_NAME);
        caches.open(CACHE_NAME)
        
        //log the cache creation
        .then(cache => cache.keys()).then(requests => requests.map(request => request.url))
        .then(console.log)
        
        return cache.addAll(PATHS_TO_CACHE);
      }
    )
    .catch(e => console.log(e))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
    .then(
      keyList => {
        let cacheKeepList = keyList.filter(key => key.indexOf(APP_PREFIX));
        cacheKeepList.push(CACHE_NAME);
        return Promise.resolve
        (
          keyList.map(
            (key, i) => {
              if (cacheKeepList.indexOf(key) === -1) {
                console.log('deleting cache : ' + keyList[i]);
                return caches.delete(keyList[i]);
              }
            }
          )
        );
      }
    )
    .catch(e => console.log(e))
  );
});

self.addEventListener('fetch', (event) => {
  //console.log('fetch request : ' + event.request.url);
  event.respondWith(
    caches.match(event.request)
    .then(
      request => {
        console.log("====== REQUEST BEING RETURNED FROM .match(event.request) ======");
        console.log(request);
        if (request) {
          console.log("====== RESPONDING WITH CACHE PATH : " + event.request.url);
          return request;
        } else {
          console.log("====== FILE PATH IS NOT CACHED, FETCHING : " + event.request.url);
          return fetch(event.request);
        }
      }
    )
    .then(response => { console.log(response); return Promise.resolve(response); })
    .catch(e => console.log(e))
  );
});