const FILES_TO_CACHE = [
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
  'https://cdn.jsdelivr.net/npm/chart.js@2.8.0'
];
const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'v1';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE = 'data-BudgetTracker' + VERSION;

self.addEventListener('install', (event) => {
  // console.log(event);
  Promise.resolve()
  .then
  (
    () => {
      event.waitUntil(
        caches.open(DATA_CACHE)
        .then
        (
          cache => {
            console.log('fetching the transactions from api at serviceworker install time');
            return fetch('/api/transaction')
            .then
            (
              response => {
                // If the response was good, 
                // clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put('/api/transaction', response.clone());
                }
                return response;
              }
            )
            .catch(e => console.log(e));
          }
        )
        .catch(e => console.log(e))
      );
    }
  )
  .then
  (
    () => {
      event.waitUntil(
        caches.open(CACHE_NAME)
        .then
        (
          cache => {
            console.log('Your files were pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE);
          }
        )
        .catch(e => console.log(e))
      );
    }
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
    .then
    (
      keyList => {
        let cacheKeepList = keyList.filter(key => key.indexOf(APP_PREFIX));
        cacheKeepList.push(CACHE_NAME);
        return Promise.resolve
        (
          keyList.map(
            (key, i) => {
              if (cacheKeepList.indexOf(key) === -1) {
                //console.log('deleting cache : ' + keyList[i]);
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

//intercept fetch requests
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    console.log(event.request.url);
    event.respondWith(
      caches.open(DATA_CACHE)
      .then
      (
        cache => { 
          return fetch(event.request).then((response) => {
            if (response.status === 200 && event.request.method === 'GET') {
              cache.put(event.request.url, response.clone());//if api fetch was good clone the url and the response object
            }
            return response;
          })
          .catch(err => cache.match(event.request))//if request failed get the objects 
        }
      )
      .catch(err => console.log(err))
    );
  } else {
    //console.log('fetch request : ' + event.request.url);
    event.respondWith(
      caches.match(event.request)
      .then
      (
        response => {
         // console.log("====== RESPONSE BEING RETURNED FROM .match(event.request) ======");
          //console.log(response);
          if (response) {
            //console.log("====== RESPONDING WITH CACHE PATH : " + event.request.url);
            return response;
          } else {
            //console.log("====== FILE PATH IS NOT CACHED, FETCHING : " + event.request.url);
            return fetch(event.request);
          }
        }
      )
      .then(response => { /*console.log(response);*/ return Promise.resolve(response); })
      .catch(e => console.log(e))
    );
  }
});