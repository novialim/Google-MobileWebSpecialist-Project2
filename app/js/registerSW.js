if ('serviceWorker' in navigator) {
  console.log("In registerSW.js")
  navigator.serviceWorker.register('/sw.js').then(function (registration) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ', registration.scope)
  }, function (err) {
    // registration failed :(
    console.log('ServiceWorker registration failed: ', err)
  })
}
