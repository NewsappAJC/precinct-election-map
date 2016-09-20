// Third party libraries
import * as L from 'leaflet';
import $ from 'jquery';

// Local modules
import updateSummary from './summary';
import makeFilters from './filters';
import updateInfo from './info';

// Set globals
var autocomplete,
  selectedBucket = 'all',
  features = [],
  geojson,
  interactiveLayer,
  app,
  $infoTip = $($('.info')[0]),
  $loading = $('#loading'),
  $map = $('#map');

console.log($infoTip)

$map.hide(); // Map is hidden until it's done loading

toggleMobile();

// Create map and get tiles from Carto
var map = L.map('map');
map.setView({ lat: 33.74, lng: -84.38}, 10);

map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

var cartodbAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';

/* add labels */
L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {pane: 'labels', attribution: cartodbAttribution}).addTo(map);

/* Create base map */ 
L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {attribution: cartodbAttribution}).addTo(map);

/* Get shapefiles */
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


/* Append precincts from .json file to list of features. */
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
  // Render filters
  makeFilters();
  $('.filter[data-filter="all"]').attr('class', 'filter-selected');

  // Default to display all precincts without any filtering
  geojson.addTo(map);
  updateSummary('all');
  $loading.hide();
  $map.show();
  map._onResize(); // Fixes weird bug http://stackoverflow.com/questions/24547468/leaflet-map-on-hide-div

  // Add event listeners to filter precincts by certain criteria.
  $('.filter, .filter-selected').each(function() {
    $(this).on('click', function() {
      // Update the layers on the map
      selectedBucket = this.dataset.filter;

      geojson.eachLayer(function (layer) {
        var layerParty = layer.feature.properties.party;
        var layerRace = layer.feature.properties.income_rac;

        var layerIncome;
        var income = layer.feature.properties.income_r_1;

        if (income < 50000) {
          layerIncome = 'low';
        }
        else if (income < 100000) {
          layerIncome = 'middle';
        }
        else if (income > 100000) {
          layerIncome = 'high'
        }

        if (layerRace === selectedBucket || 
        layerIncome === selectedBucket || 
        selectedBucket === 'all') {
          layer.setStyle(setColor(layerParty));
        }
        else {
          layer.setStyle({fillOpacity: 0});
        };
      });

      // Update the summary table results
      updateSummary(selectedBucket);

      // Unset style of all filter elements then set style of selected filter
      $('.filter-selected').attr('class', 'filter')
      $(this).attr('class', 'filter-selected')
    })
  })

  createInfo();
};

function setColor(party) {
  var style = {fillOpacity: .3};
  switch (party) {
    case 'Republican': {
      style.fillColor = 'red';
      style.opacity = .3;
      style.weight = 1;
      break;
    }
    case 'Democrat': {
      style.fillColor = 'blue';
      style.opacity = .3;
      style.weight = 1;
      break;
    }
  };
  return style;
};


/* generate a geoJson layer from the data and add event listeners. */
function generateLayers() {
  geojson = L.geoJson(features, {
      onEachFeature: onEachFeature,
      style: function(feature) { 
        var style = {color: '#2E64FE', fillOpacity: .3, opacity: .5, weight: 1};
        switch (feature.properties.party) {
          case 'Republican': {
            style.fillColor = 'red';
            break;
          }
          case 'Democrat': {
            style.fillColor = 'blue';
            break;
          }
        };
        return style;
      }
  });

  // Add event handlers to precinct layers
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
    var layer = e.target;

    layer.setStyle({
      weight: 2,
      opacity: 1,
      color: 'black'
    });

    updateInfo($infoTip, layer.feature.properties);
    $infoTip.show();
  };

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  };

  function resetStyle(e) {
    $infoTip.hide();
    var layer = e.target;

    layer.setStyle({
      opacity: .5,
      weight: 1,
      color: '#2E64FE'
    })
  }
  /**********************
  * End helper functions 
  ***********************/
};


/* Add an info box to the main map */
function createInfo() {
  $('#map').bind('mousemove', function(e) {
    if ($(window).width() > 1200) {
      $infoTip.css({left: e.pageX - 100, top: e.pageY + 20})
    }
  })
  $infoTip.hide();

  $(window).resize(function() {
    $infoTip.hide();
    toggleMobile();
  });
};

function toggleMobile() {
  if ($(window).width() < 1200) {
    $infoTip.css({left: '', top: ''}); // Fix css styles added by mousemove event handler
    $infoTip.toggleClass('fixed-bottom', true);
    $infoTip.toggleClass('follow', false);
    $infoTip.show();
  }
  else {
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

function onPlaceChanged() {
  var lat = autocomplete.getPlace().geometry.location.lat();
  var lng = autocomplete.getPlace().geometry.location.lng();
  map.setView(new L.LatLng(lat, lng), 15);
}

/* Finally, run main function to generate the map */
initInput();
getPrecincts(addPrecincts);

