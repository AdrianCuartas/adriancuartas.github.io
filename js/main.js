let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []


function registerServiceWorker()  {
  if (!navigator.serviceWorker) return;

  //var indexController = this;

  navigator.serviceWorker.register('../sw.js')
  .then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }
  }).catch(function(error){
    console.error('error',error)
  })
}

registerServiceWorker()

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
function initMap() {  
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };  
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });  
  addMarkersToMap();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

updateRestaurants();

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  }); 
}

/**
 * Set favorite restaurant
 */
const setFavoriteRestaurant = restaurant => {  
  DBHelper.setFavoriteRestaurant(restaurant)
  .then(() => {
    DBHelper.clearRestaurantsFromIDB()
    .then(()=>{
      updateRestaurants();
    })
    .catch(()=>{
      updateRestaurants();
    })    
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const favoriteButton = document.createElement('button');
  favoriteButton.className = 'restaurant-fav-button';

  const starFav = document.createElement('img');
  starFav.alt = 'favorite icon';
  if (restaurant.is_favorite === 'true') {
    starFav.src = '../img/star-filled.svg';    
  } else {
    starFav.src = '../img/star-empty.svg';    
  }

  favoriteButton.appendChild(starFav);
  favoriteButton.addEventListener('click', () => setFavoriteRestaurant(restaurant));

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = image.src.indexOf('.jpg')<0 ? image.src +'.jpg' : image.src
  image.alt = DBHelper.imageDescForRestaurant(restaurant);
  li.append(image);
  
  const container = document.createElement('div');
  container.className = 'restaurant-list-container';

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  container.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  container.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  container.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  container.append(more)

  container.append(favoriteButton);

  li.append(container)
  
  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

const setupEventListeners = () => {
  //document.addEventListener('submit', handleSubmit);
  document.querySelector('#view-map').addEventListener('click', initMap);
  //window.addEventListener('online', handleOnline);
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  setupEventListeners();
});
