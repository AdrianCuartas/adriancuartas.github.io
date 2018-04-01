var staticCacheName = 'restaurant-static-v1'

self.addEventListener('install', function(event) {    
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'js/dbhelper.js',
         'js/main.js',
         'js/restaurant_info.js',
         'css/styles.css',
         'css/responsive.css',
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
         'data/restaurants.json',
         'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png',
         'https://maps.googleapis.com/maps/api/js/ViewportInfoService.GetViewportInfo?1m6&1m2&1d40.55965355640603&2d-74.42701631559135&2m2&1d40.88229899141979&2d-73.54234334861815&2u12&4sen-US&5e0&6sm%40417000000&7b0&8e0&callback=_xdc_._t44tqm&token=9596'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('activate')
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      console.log('cacheNames',cacheNames)
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          console.log('cacheName',cacheName)
          return cacheName.startsWith('restaurant-static-') &&
                 cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );  
});