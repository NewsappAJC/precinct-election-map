// Third party libraries
import * as L from 'leaflet';
import $ from 'jquery';

// Local modules
import makeFilters from './filters';
import updateTable from './table-generator';

// DOM refs
var autocomplete,
    $infoTip = $('#info'),
    $loading = $('#loading'),
    $map = $('#map'),
    $rankingTable = $('#rank-table-body'),
    $closeButton = $('#close-button'),
    $filterSelectRow = $('#row-filter-select'),
    $filterSelect = $('#filter-select'),
    $countiesSelect = $('#counties-selector-holder'),
    $resultsSummary = $('#results-summary');

// State
var selectedBucket = 'all',
    selectedCounty = 'all',
    activePrecincts = [],
    sortedPrecincts,
    features = [],
    geojson,
    interactiveLayer,
    aggStats,
    year = 2012; //TODO change this for 2016!!

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

// Get shapefiles
function getPrecincts(cb) {
  $.ajax({
    dataType: 'json',
    //url: './2014_precincts_income_race_simple.min.json',
    url: './2012_precincts_stats_votes_filtered.json',
    success: function(data) {
      cb(data)
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
};

// Get aggregate data
function getAggregatedData(cb) {
  $.ajax({
    dataType: 'json',
    url: './2012_agg_stats.json',
    success: function(data) {
      cb(data)
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
}


// push precincts from .json file to list of features so that Leaflet can render them.
function addPrecincts(layer) {
  features = layer;
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

  // Get aggregate data for summary table
  getAggregatedData(function (data) {
    aggStats = data;
    console.log(aggStats)
    updateTitle('all')
    updateTable($resultsSummary, aggStats['ALL']['all'], year);
  });

  $loading.hide();
  $map.show();
  map._onResize(); // Fixes weird bug http://stackoverflow.com/questions/24547468/leaflet-map-on-hide-div

  function setMiniMapStyle(el) {
      $('.filter-selected').attr('class', 'filter')
      $(el).attr('class', 'filter-selected')
  };

  // Add event listeners to filter precincts by the given criteria when clicked
  $('.filter, .filter-selected, #filter-select').each(function() {
    $(this).on('change click', function(e) {
      if (!this.attributes.id) {
        value = this.dataset.filter
        setMiniMapStyle(this);
        updateFilter(value);
        $filterSelect.val(value);
        map.setView({ lat: 33.74, lng: -84.38}, 10);
      }
      else {
        var value = $(this).val();
        var filterEl = $(`a[data-filter=${value}]`);
        setMiniMapStyle(filterEl)
        updateFilter(value);
        if (e.type === 'change') {
          map.setView({ lat: 33.74, lng: -84.38}, 10);
        };
      };
    });
  });

  $('#county-select').change(function() {
    updateFilter($(this).val());
    map.setView({ lat: 33.74, lng: -84.38}, 10);
  })

  createInfo(); // Create the info box that displays precinct information
  $infoTip.hide(); // Infotip is hidden until one of the precincts is clicked
}; 

function updateFilter(filter) {
  // County filters and demographic filters are both set by this function, 
  // so we need to check if the given filter is a county or not
  var counties = ['Clayton', 'DeKalb', 'Fulton', 'Gwinnett', 'Cobb', 'All']
  if (counties.indexOf(filter) === -1) {
    selectedBucket = filter; // Get the filter from the data-filter attribute
  }
  else {
    selectedCounty = filter;
  }

  // Empty the activePrecincts array so that we can fill in only the 
  // precincts that meet the current precinct criteria
  activePrecincts = [];
  // Loop through features in the geoJSON layer
  geojson.eachLayer(function (layer) {
      var layerRace = layer.feature.properties['2012_pre_2'],
          layerCounty = layer.feature.properties.COUNTY_NAM,
          layerIncome;

    var income = layer.feature.properties['2012_pre_1']; // Assign income to high middle or low bucket

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
    if (layerCounty === selectedCounty.toUpperCase() || selectedCounty.toUpperCase() === 'ALL') {
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
  updateRankings();

  // Unset style of all filter options then style selected filter
}

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

  var titleCounty = selectedCounty.toUpperCase() != 'ALL' ? selectedCounty : 'Atlanta';

  if (feature === 'all') {
    $('#results-summary-title').html(titleCounty + ' results')
  }
  else {
    $('#results-summary-title').html(`Results in precincts with ${buckets[feature] + 
    (titleCounty != 'Atlanta'? ' (' + titleCounty + ')' : '')
    }`)
  }
};


function updateRankings() {
  if (activePrecincts.length >= 10) {
    sortedPrecincts = _.sortBy(activePrecincts, function(p) {
      return p.feature.properties.rep_p
    });
  };
  
  var parties = {topRep: [], topDem: []};
  console.log(sortedPrecincts)

  _.each(parties, function(value, key, obj) {
    for (var i = 0; i < 5; i++) {
      if (key === 'topDem') {
        obj[key].push(sortedPrecincts[i]);
      }
      else {
        obj[key].push(sortedPrecincts[sortedPrecincts.length - (i + 1)]);
      }
    };
  });

  createRankDiv(parties);
  return
};

function createRankDiv(parties) {
  $rankingTable.html('');
  for (var i = 0; i < 5; i++) {
    var repPrecinct = parties.topRep[i].feature
    var demPrecinct = parties.topDem[i].feature

    var demVotes = parseInt(demPrecinct.properties.dem_p*100);
    var repVotes = parseInt(repPrecinct.properties.rep_p*100);

    $rankingTable.append(`
      <tr>
        <td class="rank">${i+1}</td>
        <td class="proportion">
          <div>
            ${demPrecinct.properties.PRECINCT_N} 
            <strong>
              - ${demVotes}%
            </strong>
          </div>
          <div class="rank-sub-county">
            ${demPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
        <td class="proportion">
          <div>
            ${repPrecinct.properties.PRECINCT_N} 
            <strong>
              - ${repVotes}%
            </strong>
          </div>
          <div class="rank-sub-county">
            ${repPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
      </tr>
    `);
  };
};

// Return an object with appropriate styles given the party results of a given precinct
function setColor(feature) {
  var style = {color: '#2E64FE', fillOpacity: .3, opacity: .5, weight: 1};

  var party = feature.properties.rep_votes > feature.properties.dem_votes ? 'Republican' : 'Democrat';

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

    $('#info-title').html(`<span class="eln-title">${layer.feature.properties.PRECINCT_N} (${layer.feature.properties.COUNTY_NAM})</span>`)
    updateTable('#info-data', layer.feature.properties, year);
    $infoTip.show();
  };

  function zoomToFeature(e) {
    highlightFeature(e);
    if ($(window).width() > 1200) { // it's distracting to zoom on mobile
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
      if (e.pageY < ($(window).height() - 120)) {
        $infoTip.css({left: e.pageX - 100, top: e.pageY + 20})
      }
      else {
        $infoTip.css({left: e.pageX - 100, top: e.pageY - 120})
      }
    }
  })

  // Event handler to change display of tooltip for mobile or desktop
  $(window).resize(function() {
    $infoTip.hide();
    toggleMobile();
    if ($(window).width() < 1200) {
      $infoTip.show(); // In case window resizes when user's mouse isn't hovering over a precinct
    }
  });

  // Hide info tip when close button is clicked
  $closeButton.on('click', function() {
    $infoTip.hide();
  })

  $infoTip.hide(); // Don't display info tip until user mouses over or clicks on map
};


/* Depending on the size of the display, have tooltip follow the mouse or stick to the
bottom of the screen. */
function toggleMobile() {
  if ($(window).width() < 1200) {
    $('#filters').hide(); // Instead of showing filter options as boxes, display as select box
    $filterSelectRow.show();
    $closeButton.show();

    // Configure infotip
    $infoTip.css({left: '', top: ''}); // Remove css styles added by mousemove event handler
    $infoTip.toggleClass('fixed-bottom', true);
    $infoTip.toggleClass('follow', false);
  }
  else {
    $('#filters').show(); 
    $filterSelectRow.hide();
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

