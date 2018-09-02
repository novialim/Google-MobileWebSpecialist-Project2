
var cacheID = 'mws-restaurant-001';

var urlsToCache = [
  './',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  'img',
  '/js/swController.js'
]

self.addEventListener('install', function (event) {
  // Perform install steps
  console.log('installing ServiceWorker')
  event.waitUntil(
    caches.open(cacheID)
      .then(function (cache) {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.log('Caches open failed: ' + error);
          })
      })
  )
})
//
// self.addEventListener('activate', function (event) {
//   console.log('in activate')
//   event.waitUntil(
//     caches.keys().then(function (cacheNames) {
//       return Promise.all(
//         cacheNames.filter(function (cacheName) {
//           return cacheName.startsWith('restaurant-') &&
//             cacheName != CACHE_NAME
//         }).map(function (cacheName) {
//           return caches.delete(cacheName)
//         })
//       )
//     })
//   )
// })

self.addEventListener('fetch', function (event) {
  console.log('fetching...')

  let cacheRequest = event.request
  let cacheUrlObj = new URL(event.request.url)
  if (event.request.url.indexOf('restaurant.html') > -1) {
    const cacheURL = 'restaurant.html'
    cacheRequest = new Request(cacheURL)
  }

  const URLCheck = new URL(event.request.url)
  if (URLCheck.port === '1337') {
    const parts = URLCheck.pathname.split('/')
    const id =
      parts[parts.length - 1] === 'restaurants'
        ? '-1'
        : parts[parts.length - 1]
    fetchJSON(event)
  } else {
    cacheResponse(event)
  }
})

function fetchJSON(event) {
  // Only use caching for GET events
  if (event.request.method !== 'GET') {
    return fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(json => {
        return json
      });
  }
}

function cacheResponse(event){
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(responseF =>{
        return caches.open(cacheID).then(cache => {
          cache.put(event.request, responseF.clone())
          return responseF;
        })
      })
    })
  );
}
