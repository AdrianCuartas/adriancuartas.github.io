var staticCacheName = 'restaurant-static-v2'

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
         'img/star-empty.svg',
         'img/star-filled.svg'   
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {      
      return Promise.all(
        cacheNames.filter(function(cacheName) {         
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
  if(event.request.method === "POST") return event  
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetchAndCache(event.request);
    })
  );  
});

function fetchAndCache(url) {
  return fetch(url)
    .then(function(response){      
      return caches.open(staticCacheName)
        .then(function(cache) {
          if (!url.url.endsWith('/reviews')) {
            cache.put(url, response.clone());
          }
          
          return response;
        })
        .catch(function(error){
          console.error('Open caches failed:', error)
        })
    })
    .catch(function(error) {
      console.error('Request failed:', error);
    });

}