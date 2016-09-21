// Third party libraries
import * as L from 'leaflet';
import $ from 'jquery';

// Local modules
import updateSummary from './summary';
import makeFilters from './filters';
import updateInfo from './table-generator';

// Globals
var autocomplete,
  selectedBucket = 'all',
  features = [],
  geojson,
  interactiveLayer,
  $infoTip = $($('.info')[0]),
  $loading = $('#loading'),
  $map = $('#map'),
  $closeButton = $('#close-button');

$map.hide(); // Map is hidden until it's done loading
toggleMobile(); // Check size of display and show precinct information accordingly

// Create Leaflet map and get tiles from Carto
var map = L.map('map');
map.setView({ lat: 33.74, lng: -84.38}, 10);

// Use panes to "sandwich" GeoJSON features between map tiles and road labels
map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

// Attribution
var cartodbAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';

// Labels
L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {pane: 'labels', attribution: cartodbAttribution}).addTo(map);

// Create base map
L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {attribution: cartodbAttribution}).addTo(map);

// Get shapefiles
function getPrecincts(cb) {
  $.ajax({
    dataType: 'json',
    url: './2014_precincts_income_race.json',
    success: function(data) {
      cb(data)
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
};


// Append precincts from .json file to list of features so that Leaflet can render them.
function addPrecincts(precincts) {
  $(precincts).each(function(key, feature) {
    features.push(feature);
  });
  console.log(features);
  generateLayers();
  createMap();
}


/* Generate a map and a list of filter options */
function createMap() {
  // Render filters for demographic data like race and income
  makeFilters();

  // Default to display all precincts without any filtering
  $('.filter[data-filter="all"]').attr('class', 'filter-selected');

  // Add the geoJSON data to the map, hide the loading screen, and update the summary table
  geojson.addTo(map); 
  updateSummary('all');
  $loading.hide();
  $map.show();
  map._onResize(); // Fixes weird bug http://stackoverflow.com/questions/24547468/leaflet-map-on-hide-div

  // Add event listeners to filter precincts by the given criteria when clicked
  $('.filter, .filter-selected').each(function() {
    $(this).on('click', function() {
      selectedBucket = this.dataset.filter; // Get the filter from the data-filter attribute

      // Loop through features in the geoJSON layer
      geojson.eachLayer(function (layer) {
          var layerRace = layer.feature.properties.income_rac,
            layerIncome;

        var income = layer.feature.properties.income_r_1; // Assign income to high middle or low bucket

        if (income < 50000) {
          layerIncome = 'low';
        }
        else if (income < 100000) {
          layerIncome = 'middle';
        }
        else if (income > 100000) {
          layerIncome = 'high'
        }

        // Check if each precinct meets the filter criteria, and color its fill accordingly
        if (layerRace === selectedBucket ||
        layerIncome === selectedBucket ||
        selectedBucket === 'all') {
          layer.setStyle(setColor(layer.feature));
        }
        else {
          layer.setStyle({fillOpacity: 0});
        };
      });

      // Update the summary table results for the given filter
      updateSummary(selectedBucket);

      // Unset style of all filter options then style selected filter
      $('.filter-selected').attr('class', 'filter')
      $(this).attr('class', 'filter-selected')
    })
  })

  createInfo(); // Create the info box that displays precinct information
};

// Return an object with appropriate styles given the party results of a given precinct
function setColor(feature) {
  var style = {color: '#2E64FE', fillOpacity: .3, opacity: .5, weight: 1};

  var party = feature.properties.rep_v > feature.properties.dem_v ? 'Republican' : 'Democrat';

  switch (party) {
    case 'Republican': {
      style.fillColor = 'red';
      break;
    }
    case 'Democrat': {
      style.fillColor = '#2ECCFA';
      break;
    }
  };
  return style;
};


// generate a geoJson layer from the data, set initial styles, and add event listeners.
function generateLayers() {
  geojson = L.geoJson(features, {
      onEachFeature: onEachFeature,
      style: function(feature) { 
        return setColor(feature)
      }
  });

  // Add event handlers to precinct features to change tooltips
  function onEachFeature(feature, layer) {
    layer.on({
      click: zoomToFeature,
      mouseover: highlightFeature,
      mouseout: resetStyle
    })
  };

  /*********************** 
  * Begin helper functions 
  ************************/
  function highlightFeature(e) {
    geojson.eachLayer(function (layer) {
      layer.setStyle({opacity: .5, weight: 1, color: '#2E64FE'})
    })
    var layer = e.target;

    layer.setStyle({
      weight: 3,
      opacity: 1,
      color: 'black'
    });

    $('#info').append(`<h4 class="eln-title">Precinct ${props.PRECINCT_I} (${props.COUNTY_NAM})</h4>`)
    updateInfo('#info-data', layer.feature.properties);
    $infoTip.show();
  };

  function zoomToFeature(e) {
    highlightFeature(e);
    if ($(window).width() > 1200) { // it's distracting to zoom in on mobile
      map.fitBounds(e.target.getBounds());
    }
  };

  function resetStyle(e) {
    if ($(window).width() > 1200) {
      $infoTip.hide();
    }

    e.target.setStyle({
      opacity: .5,
      weight: 1,
      color: '#2E64FE'
    })
  }
  /**********************
  * End helper functions 
  ***********************/
};


// Add an info box to the main map
function createInfo() {
  // Event handler to change position of tooltip depending on mouse position (on desktop only)
  $('#map').bind('mousemove', function(e) {
    if ($(window).width() > 1200) { // info box shouldn't hide on mobile unless the user clicks the close button
      $infoTip.css({left: e.pageX - 100, top: e.pageY + 20})
    }
  })

  // Event handler to change display of tooltip for mobile or desktop
  $(window).resize(function() {
    $infoTip.hide();
    toggleMobile();
  });

  // Only display the close button on mobile
  $closeButton.on('click', function() {
    $infoTip.hide();
  })

  $infoTip.hide(); // Don't display info tip until user mouses over or clicks on map
};


/* Depending on the size of the display, have tooltip follow the mouse or stick to the
bottom of the screen. */
function toggleMobile() {
  if ($(window).width() < 1200) {
    $closeButton.show();
    $infoTip.css({left: '', top: ''}); // Remove css styles added by mousemove event handler
    $infoTip.toggleClass('fixed-bottom', true);
    $infoTip.toggleClass('follow', false);
    $infoTip.show();
  }
  else {
    $closeButton.hide();
    $infoTip.toggleClass('fixed-bottom', false);
    $infoTip.toggleClass('follow', true);
  }
}


/* Add event listeners to autocomplete input field and query Google
 * Places API */
function initInput() {
  var input = document.getElementById('address-input');
  var options = {types: ['address']}
  autocomplete = new google.maps.places.Autocomplete(input, options);

  autocomplete.addListener('place_changed', onPlaceChanged)
}

// Pan map to the address selected by the user
function onPlaceChanged() {
  var lat = autocomplete.getPlace().geometry.location.lat();
  var lng = autocomplete.getPlace().geometry.location.lng();
  map.setView(new L.LatLng(lat, lng), 15);
}

// Finally, run main function to generate the map
initInput();
getPrecincts(addPrecincts);

