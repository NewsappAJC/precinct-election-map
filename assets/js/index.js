// Third party libraries
import * as L from 'leaflet';
import $ from 'jquery';

// Local modules
import makeFilters from './filters';
import updateTable from './table-generator';
import updateRankings from './ranking-table';

// Constants
var MOBILE_WIDTH = 600;

// DOM refs
var autocomplete,
    $infoTip = $('#info'),
    $loading = $('#loading'),
    $map = $('#map'),
    $closeButton = $('#close-button'),
    $filterSelect = $('#demographic-select'),
    $countiesSelect = $('#counties-selector-holder'),
    $resultsSummary = $('#results-summary'),
    $2012toggle = $('#2012-toggle'),
    $2016toggle = $('#2016-toggle');

// State
var selectedBucket = 'all',
    selectedCounty = 'all counties',
    activePrecincts = [],
    features = [],
    geojson,
    interactiveLayer,
    aggStats,
    year = 2016; //TODO change this for 2016!!

// Helper functions 
function highlight(el) {
    $('.filter-selected').attr('class', 'filter-bar')
    $(el).attr('class', 'filter-selected')
};

$map.hide(); // Map is hidden until it's done loading
toggleMobile(); // Check size of display and display precinct information accordingly

// Create Leaflet map and get tiles from Carto
var map = L.map('map', {minZoom: 9, scrollWheelZoom: false});
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

// Add event listener to year toggle
$2012toggle.on('click', function() {
  year = 2012;
  $(this).removeClass('inactive-year-toggle');
  $2016toggle.addClass('inactive-year-toggle');
  geojson.clearLayers();
  getPrecincts(addPrecincts, year);
  getAggregatedData();
})

$2016toggle.on('click', function() {
  year = 2016;
  $(this).removeClass('inactive-year-toggle');
  $2012toggle.addClass('inactive-year-toggle');
  geojson.clearLayers();
  getPrecincts(addPrecincts, year);
  getAggregatedData();
})

function updateFilter(filter) {
  // County filters and demographic filters are both set by this function, 
  // so we need to check if the given filter is a county or not
  var counties = ['Clayton', 'DeKalb', 'Fulton', 'Gwinnett', 'Cobb', 'All counties', 'all counties']
  if (counties.indexOf(filter) === -1) {
    selectedBucket = filter; // Get the filter from the data-filter attribute
  }
  else {
    selectedCounty = filter;
  }

  // Empty the activePrecincts array so that we can fill in only the 
  // precincts that meet the current precinct criteria
  activePrecincts = [];

  // Loop through features in the geoJSON layer (ie the precincts)
  geojson.eachLayer(function (layer) {
    var layerRace = layer.feature.properties['race'],
        layerCounty = layer.feature.properties.COUNTY_NAM,
        layerIncome;

    var income = layer.feature.properties['avg_income']; // Assign income to high middle or low bucket

    if (!layer.feature.properties['dem_votes'] && !layer.feature.properties['rep_votes']) {
      map.removeLayer(layer);
    };

    // TODO bin this in the data so I don't have to do it here
    if (income < 50000) {
      layerIncome = 'low';
    }
    else if (income < 100000) {
      layerIncome = 'mid';
    }
    else if (income > 100000) {
      layerIncome = 'high'
    }

    // Check if each precinct meets the filter criteria, and change its fill color accordingly
    if (layerCounty === selectedCounty.toUpperCase() || selectedCounty.toUpperCase() === 'ALL COUNTIES') {
      if (layerRace === selectedBucket ||
      layerIncome === selectedBucket ||
      selectedBucket === 'all') {
        layer.setStyle(setColor(layer.feature));
        activePrecincts.push(layer);
      }
      else {
        layer.setStyle({fillOpacity: 0});
      };
    }
    else {
      layer.setStyle({fillOpacity: 0});
    };
  });

  // Update the summary table results for the given filter
  updateTitle(selectedBucket);
  updateTable($resultsSummary, aggStats[selectedCounty.toUpperCase()][selectedBucket], year);
  updateRankings(activePrecincts, selectedCounty, selectedBucket, year);

  // Add zoom functionality when user clicks one of the top precincts.
  $('.rank-row').each(function() {
    $(this).on('click', function() {
        var lng = parseFloat(this.dataset['x']),
            lat = parseFloat(this.dataset['y']);

      console.log(lat + ' ' + lng)
      map.setView({lat: lat, lng: lng}, 14);
    });
  });
}
// Get shapefiles
function getPrecincts(cb, year) {
  var url = year === 2012 ? '2012_precincts_stats_votes_simple2.json' : '2014_precincts_income_raceUPDATE.json';
  $.ajax({
    dataType: 'json',
    url: url,
    success: function(data) {
      cb(data)
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
};

function getPastPrecincts(cb, year) {
  //var url = year === 2012 ? '2012_precincts_stats_votes_simple.json' : '2014_precincts_income_raceUPDATE.json';
  $.ajax({
    dataType: 'json',
    url: './2014_precincts_income_race_simple.min.json',
    success: function(data) {
      cb(data)
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
};


// push precincts from .json file to list of features so that Leaflet can render them.
function addPrecincts(layer) {
  features = layer;
  console.log(features);
  generateLayers();
  createMap();
  getAggregatedData();
}


/* Generate a map and a list of filter options */
function createMap() {
  // Render filters for demographic data like race and income

  // Default to display all precincts without any filtering
  $('.filter[data-filter="all"]').attr('class', 'filter-selected');

  // Add the geoJSON data to the map, hide the loading screen, and update the summary table
  geojson.addTo(map); 


  // Add event listeners to filter precincts by the given criteria when clicked

  $('#county-select').change(function() {
    var value = $(this).val();
    updateFilter(value);
    map.setView({ lat: 33.74, lng: -84.38}, 10);
  })

  createInfo(); // Create the info box that displays precinct information
  $infoTip.hide(); // Infotip is hidden until one of the precincts is clicked
}; 

function addFilterListeners() {
  $('.filter-bar, .filter-selected, #demographic-select').each(function() {
    $(this).on('change click', function(e) {
      console.log('filter clicked')
      // Inelegant way of getting the minimaps instead of the select box.
      var value = this.dataset.filter || $(this).val();
      updateFilter(value);
      $filterSelect.val(value);
      map.setView({ lat: 33.74, lng: -84.38}, 10);
    });
  });

  $('.filter-bar, .filter-selected').each(function() {
    $(this).on('click', function(e) {
      highlight(this);
    });
  });
};


// Set the title of summary table
function updateTitle(feature) {
  var buckets = {
    'white': 'at least 50% white population',
    'black': 'at least 50% black population',
    'hispanic': 'at least 50% Hispanic population',
    'high': 'a mean household income above $100,000',
    'mid': 'a mean household income between $50,000 and $100,000',
    'low': 'a mean household income below $50,000'
  };

  var titleCounty = selectedCounty.toUpperCase() != 'ALL COUNTIES' ? selectedCounty : 'Atlanta';

  if (feature === 'all') {
    $('#results-summary-title').html(titleCounty + ' results')
  }
  else {
    $('#results-summary-title').html(`Results in precincts with ${buckets[feature] + 
    (titleCounty != 'Atlanta'? ' (' + titleCounty + ' County)' : '')
    }`)
  }
};



// Return an object with appropriate styles given the party results of a given precinct
function setColor(feature) {
  var style = {color: 'white', fillOpacity: .3, fillColor: '#e2e2e2', opacity: .5, weight: 1},
      rep = feature.properties.rep_votes,
      dem = feature.properties.dem_votes;

  // Skip precincts with null values for both republican and democrat vote counts
  if (!rep && !dem) {
    return style;
  }

  var party = rep > dem ? 'Republican' : 'Democrat';

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
    if (!layer.feature.properties.rep_votes && !layer.feature.properties.dem_votes) {
      map.removeLayer(layer);
    };
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

    if ($(window).width() > MOBILE_WIDTH) {
      $('#info-title').html(`<span class="eln-title">${layer.feature.properties.PRECINCT_N} 
          <span class="sub-county">
            ${layer.feature.properties.COUNTY_NAM} COUNTY
        </span>`)
      updateTable('#info-data', layer.feature.properties, year);

      geojson.eachLayer(function (layer) {
        layer.setStyle({opacity: .5, weight: 1, color: 'white'})
      })

      layer.setStyle({
        weight: 3,
        opacity: 1,
        color: 'black'
      });

      $infoTip.show();
    };
  };

  function zoomToFeature(e) {
    var layer = e.target;

    $('#info-title').html(`<span class="eln-title">${layer.feature.properties.PRECINCT_N} 
        <span class="sub-county">
          ${layer.feature.properties.COUNTY_NAM} COUNTY
      </span>`)
    updateTable('#info-data', layer.feature.properties, year);

    geojson.eachLayer(function (layer) {
      layer.setStyle({opacity: .5, weight: 1, color: '#2E64FE'})
    })

    layer.setStyle({
      weight: 3,
      opacity: 1,
      color: 'black'
    });

    highlightFeature(e);
    if ($(window).width() > MOBILE_WIDTH) { // it's distracting to zoom on mobile
      map.fitBounds(e.target.getBounds());
      return
    }
    var coords = {x: e.originalEvent.clientX, y: e.originalEvent.clientY, click:true };
    placeInfo(coords)
    $infoTip.show();
  };

  function resetStyle(e) {
    if ($(window).width() > MOBILE_WIDTH) {
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
    if ($(window).width() > MOBILE_WIDTH) {
      var dets = {x: e.pageX, y: e.pageY, click: false};
      placeInfo(dets);
    };
  });
};

function placeInfo(e) {
  // Move the info tip above the mouse if the user is at the bottom of the screen
  if ($(window).width() > MOBILE_WIDTH || e.click) { // it's distracting to zoom on mobile

    $infoTip.css({left: e.x, top: e.y + 20})

    if (e.y > ($(window).height() - 120)) {
      $infoTip.css({top: e.y - 100})
    };

    if (e.x > ($(window).width() - 200)) {
      $infoTip.css({left: $(window).width() - 200})
    };
  };

  // Event handler to change display of tooltip for mobile or desktop
  $(window).resize(function() {
    $infoTip.hide();
    toggleMobile();
  });

  // Hide info tip when close button is clicked
  $closeButton.on('click', function() {
    $infoTip.hide();
  })
};


/* Depending on the size of the display, have tooltip follow the mouse or stick to the
bottom of the screen. */
function toggleMobile() {
  if ($(window).width() < MOBILE_WIDTH) {
    $('#filters').hide(); // Instead of showing filter options as boxes, display as select box
    $closeButton.show();

    // Configure infotip
    $infoTip.css({left: '', top: ''}); // Remove css styles added by mousemove event handler
    $infoTip.toggleClass('fixed-bottom', true);
    $infoTip.toggleClass('follow', false);
  }
  else {
    $('#filters').show(); 
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
getPrecincts(addPrecincts, year);

// Get aggregate data
function getAggregatedData() {
  var url = year == 2012 ? './2012agg_stats.json' : './2014agg_stats.json';
  $.ajax({
    dataType: 'json',
    url: url,
    success: function(data) {
      // Update state
      aggStats = data;

      // Add filters
      makeFilters(aggStats);
      addFilterListeners();
      
      // Add default values
      updateTitle('all')
      updateTable($resultsSummary, aggStats['ALL COUNTIES']['all'], year);
      updateFilter('all');
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
}

$loading.hide();
$map.show();
// Fixes weird bug http://stackoverflow.com/questions/24547468/leaflet-map-on-hide-div
map._onResize(); 

