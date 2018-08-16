let restaurant;
var map;

/**
 * Initialize Google map
 */
function initMap() { 
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false
      });  

      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
}

/**
 * Display offline alert
 */
const offlineAlert = function(message){
  const container = document.createElement('div');
  container.className = 'offline-alert';
  const text = document.createElement('p');
  text.textContent = message;  
  container.appendChild(text);
  const body = document.getElementsByTagName('body')[0];

  body.appendChild(container);
  setTimeout(() => {
    body.removeChild(container);
  }, 5000);
};


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {  
  if (self.restaurant) { // restaurant already fetched!    
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {    
       DBHelper.fetchRestaurantById(id, (error, restaurant) => {        
        self.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }        
        fillRestaurantHTML();
        callback(null, restaurant)
      });    
    }
  }

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {  
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = DBHelper.imageDescForRestaurant(restaurant);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = image.src.indexOf('.jpg')<0 ? image.src +'.jpg' : image.src

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = reviews  => {        
  const container = document.getElementById('reviews-container');
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');
  // remove existing reviews
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }
  // insert actual reviews
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className="commentsName"
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className ="commentsDate"
  date.innerHTML = review.updatedAt;  
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.className = "commentsRating"
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');  
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {  
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');  
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Submit review
 */
const submitReview = function(e) {
  e.preventDefault();  
  const txtName = document.getElementById('name').value;  
  const txtComments = document.getElementById('comments').value;
  const txtRating = document.getElementById('rate').value;  
  // bad input
  if(txtName=='' || txtComments.value=='' || isNaN(txtRating) ||  txtRating>5 ||  txtRating<1) return  
  const review = {
    restaurant_id: getParameterByName('id'),
    name : txtName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rating: txtRating,
    comments: txtComments    
  };

  if (navigator.onLine) DBHelper.insertReview(review, function(){ getReviews() });  
  else {   
    // get reviews from localStorage
    const reviewsStored = JSON.parse(localStorage.getItem('reviewsStored'));

    let reviewsToStore;
    if (reviewsStored && reviewsStored.length > 0) {
      reviewsToStore = reviewsStored
      reviewsToStore.push(review);      
    } 
    else {
      reviewsToStore = [review]
    }
    
    localStorage.setItem('reviewsStored', JSON.stringify(reviewsToStore));

    getReviews();   
    
    offlineAlert('Connectivity lost');
  }
 
  document.getElementById('name').value = ''
  document.getElementById('comments').value= ''
  document.getElementById('rate').value = ''
};

/**
 * Upload pending reviews
 */
const uploadReviews = () => {
  if (navigator.onLine) {   
    // fet stored reviews
    const reviewsStored = JSON.parse(localStorage.getItem('reviewsStored'));

    if (reviewsStored && reviewsStored.length > 0) {      
      reviewsStored.forEach(review => DBHelper.insertReview(review, function(){ getReviews() }));
    }
    // clean stored reviews    
    localStorage.setItem('reviewsStored', JSON.stringify([]));
  }
  else {
   getReviews()
  }
}

/**
 * Get reviews
 */
const getReviews = () => { 
  console.log('pasa por getReviews')
  let reviewsOffline = JSON.parse(localStorage.getItem('reviewsStored'));
  if (reviewsOffline === null) reviewsOffline = []
  
  DBHelper.fetchReviewsById(getParameterByName('id'), (error, reviews) => {    
    const filteredReviews = reviews.filter(review => !reviewsOffline.find(rev => rev.id === review.id));
    const reviewsToDisplay = filteredReviews.concat(reviewsOffline)
    fillReviewsHTML(reviewsToDisplay);
  });
};

const setEventListeners = () => {  
  window.addEventListener('online', uploadReviews());
  document.addEventListener('submit', submitReview);
  document.querySelector('#view-map').addEventListener('click', initMap); 
};

document.addEventListener('DOMContentLoaded', event => {     
  setEventListeners();  
});


/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


fetchRestaurantFromURL((error, _restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {        
      restaurant = _restaurant;
      fillBreadcrumb();  
    }
});

getReviews()