import idb from "idb";

var CACHE_NAME = 'restaurant-cache-v8'

const dbPromise = idb.open("udacity-restaurant", 2, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants", { keyPath: "id" });
  }
});

var urlsToCache = [
  "./",
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  "js/registerSW.js"
]

self.addEventListener('install', function (event) {
  // Perform install steps
  console.log("installing ServiceWorker")
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('activate', function (event) {
  console.log("in activate")
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

self.addEventListener('fetch', function (event) {
  console.log('fetching...')

  let cacheRequest = event.request
  let cacheUrlObj = new URL(event.request.url)
  if (event.request.url.indexOf("restaurant.html") > -1) {
    const cacheURL = "restaurant.html"
    cacheRequest = new Request(cacheURL)
  }

  const URLCheck = new URL(event.request.url)
  if (URLCheck.port === "1337") {
    const parts = URLCheck.pathname.split("/")
    const id =
      parts[parts.length - 1] === "restaurants"
        ? "-1"
        : parts[parts.length - 1]
    handleAJAXEvent(event, id)
  } else {
    handleOthers(event, cacheRequest)
  }
})

const handleAJAXEvent = (event, id) => {
  event.respondWith(
    dbPromise
      .then(db => {
        return db
          .transaction("restaurants")
          .objectStore("restaurants")
          .get(id)
      })
      .then(data => {
        return (
          (data && data.data) ||
          fetch(event.request)
            .then(fetchResponse => fetchResponse.json())
            .then(json => {
              return dbPromise.then(db => {
                const tx = db.transaction("restaurants", "readwrite")
                tx.objectStore("restaurants").put({
                  id: id,
                  data: json
                })
                return json
              })
            })
        )
      })
      .then(result => {
        return new Response(JSON.stringify(result))
      })
      .catch(error => {
        return new Response("Error fetching data", { status: 500 })
      })
  )
}

const handleOthers = (event, cacheRequest) => {
  event.respondWith(
    caches.match(cacheRequest).then(response => {
      return (
        response ||
        fetch(event.request)
          .then(fetchResponse => {
            return caches.open(cacheID).then(cache => {
              cache.put(event.request, fetchResponse.clone())
              return fetchResponse
            })
          })
          .catch(error => {
            if (event.request.url.indexOf(".jpg") > -1) {
              return caches.match("/img/na.png")
            }
            return new Response(
              "Application is not connected to the internet",
              {
                status: 404,
                statusText: "Application is not connected to the internet"
              }
            )
          })
      )
    })
  )
}
