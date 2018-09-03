import idb from 'idb';

var cacheID = 'mws-restaurant-001';

const dbPromise = idb.open('udacity-restaurant', 4, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
      break;
    case 1:
      upgradeDB.createObjectStore('pending', {
        keyPath: 'id',
        autoIncrement: true
      });
  }
});

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
    fetchJSON(event, id)
  } else {
    cacheResponse(event, cacheRequest)
  }
})

function fetchJSON(event, id) {
  // Only use caching for GET events
  if (event.request.method !== 'GET') {
    return fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(json => {
        return json
      });
  }
    handleRestaurantEvent(event, id);
}

const handleRestaurantEvent = (event, id) => {
  event.respondWith(dbPromise.then(db => {
    return db
      .transaction('restaurants')
      .objectStore('restaurants')
      .get(id);
  }).then(data => {
    return (data && data.data) || fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(json => {
        return dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          store.put({id: id, data: json});
          return json;
        });
      });
  }).then(finalResponse => {
    return new Response(JSON.stringify(finalResponse));
  }).catch(error => {
    return new Response('Error fetching data', {status: 500} + error);
  }));
};


function cacheResponse(event, cacheRequest){
  event.respondWith(
    caches.match(cacheRequest).then(response => {
      return response || fetch(event.request).then(responseF =>{
        return caches.open(cacheID).then(cache => {
          if (responseF.url.indexOf('browser-sync') === -1) {
            cache.put(event.request, responseF.clone())
          }
          return responseF
        }).catch(error => {
          if (event.request.url.indexOf('.jpg') > -1) {
            return caches.match('/img/undefined.png')
          }
          return new Response('Application is not connected to the internet', {
            status: 404,
            statusText: 'Application is not connected to the internet'
          })
        })
      })
    })
  );
}
