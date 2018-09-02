import { set, get } from 'idb-keyval';

var CACHE_NAME = 'restaurant-cache-v8'

var urlsToCache = [
  './',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/img/na/jpg',
  '/js/swController.js'
]

self.addEventListener('install', function (event) {
  // Perform install steps
  console.log('installing ServiceWorker')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('activate', function (event) {
  console.log('in activate')
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('restaurant-') &&
            cacheName != CACHE_NAME
        }).map(function (cacheName) {
          return caches.delete(cacheName)
        })
      )
    })
  )
})


function fetchJSON(request) {
  return get('restaurants')
    .then(restaurants => {
      return ( restaurants || fetch(request)
          .then(response => response.json())
          .then(restaurantsJ => {
            set('restaurants', restaurantsJ)
            restaurantsJ.forEach(function (rest) {
              set(rest.id, rest)
            })
            return restaurantsJ
          })
      )
    })
    .then(response => new Response(JSON.stringify(response)))
}

function cacheResponse(event){
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(responseF =>{
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseF.clone())
          return responseF;
        })
      })
    })
  );
}

self.addEventListener('fetch', function (event) {

  const URLCheck = new URL(event.request.url)
  if(URLCheck.port ==='1337'){
    event.respondWith( fetchJSON(event.request));
  }
  else {
    event.waitUntil(
      cacheResponse(event)
    );
  }
})
