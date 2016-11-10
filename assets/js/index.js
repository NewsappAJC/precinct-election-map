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
    $2016toggle = $('#2016-toggle'),
    $metaHolder = $('meta-holder'),
    $metaReporting = $('#meta-reporting'),
    $metaLastUpdated = $('#meta-last-updated');

// State
var selectedBucket = 'all', // Holds demographic filters
    selectedCounty = 'all counties', // Holds county filters
    activePrecincts = [],
    features = [],
    year = 2016,
    geojson,
    interactiveLayer,
    aggStats,
    map,
    lastUpdated,
    precinctsReporting;

var $selectedPrecinct; //so we can deselect it when another is chosen without looping through everything
var stickyOn = false; //whether or not a precinct has been clicked

/**************************************
 * Create a Leaflet map instance and get map
 * tiles from OpenStreetMap
**************************************/
function getTiles() {
  // Create Leaflet map and get tiles from Carto
  map = L.map('map', {minZoom: 9, scrollWheelZoom: false});
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
};


/**************************************
 * Add event listeners to autocomplete address 
 * input field and query Google Places API
 * https://developers.google.com/maps/documentation/javascript/places-autocomplete
 * **************************************/
function initInput() {
  var input = document.getElementById('address-input');
  var options = {types: ['address']}
  autocomplete = new google.maps.places.Autocomplete(input, options);

  autocomplete.addListener('place_changed', onPlaceChanged)
};


/**************************************
 * Add event handlers to the year toggles.
 * Load the precincts for the selected year
 * and load the relevant aggregated data
**************************************/
$2012toggle.on('click', function() {
  year = 2012;
  $(this).removeClass('inactive-year-toggle');
  $2016toggle.addClass('inactive-year-toggle');
  geojson.clearLayers();
  getPrecincts(addPrecincts, year);
  getAggregatedData();
  $metaHolder.hide();
})

$2016toggle.on('click', function() {
  year = 2016;
  $(this).removeClass('inactive-year-toggle');
  $2012toggle.addClass('inactive-year-toggle');
  geojson.clearLayers();
  getPrecincts(addPrecincts, year);
  getAggregatedData();
  $metaHolder.show();
})
/**************************************
 * Make AJAX request to get metadata 
 * about the number of precincts loaded
 * and the last time the script ran
**************************************/
function getMetadata() {
  var url;
  $.ajax({
    dataType: 'json',
    url: '2014_metadata.json',
    success: function(data) {
      var precinctsReporting = data['precincts_reporting'];
      var totalPrecincts = data['total_precincts'];
      var lastUpdated = data['last_update'];

      $metaLastUpdated.html(`Last updated ${lastUpdated}`);
      $metaReporting.html(`${precinctsReporting} / ${totalPrecincts} precincts reporting`);
    },
    failure: function() {
      console.log('failed to get precincts.');
    }
  });
};


/**************************************
 * Make AJAX request to load the map data
 * depending which year is selected
**************************************/
function getPrecincts(cb, year) {
  var url;
  if (year === 2012) {
    url = '2012_precincts_stats_votes_simple2.json';
  }
  else {
    url = '2014_precincts_income_raceUPDATE.json';
  }

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

/**************************************
 * Make AJAX request to get aggregate stats
 * for each demographic group and county
 **************************************/
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

/**************************************
 * Generate a geoJson layer from the data, 
 * set initial styles, and add event listeners.
**************************************/
function generateLayers() {
  geojson = L.geoJson(features, {
      onEachFeature: onEachFeature,
      style: function(feature) {
        return setColor(feature);
      }
  });

  // Add event handlers to precinct features to change tooltips
  function onEachFeature(feature, layer) {
    if (!layer.feature.properties.rep_votes && !layer.feature.properties.dem_votes) {
      map.removeLayer(layer);
    };
    layer.on({
      click: targetFeature,
      mouseover: targetFeature,
      mouseout: resetStyle
    });
  };

  /*********************** 
  * Begin helper functions for Geojson
  ************************/
  function targetFeature(e) {
    var layer = e.target,
        pathID = layer._path.id;

    if(e.type === "click"){
      if(stickyOn && pathID === $selectedPrecinct.attr('id')){ //stop being sticky if sticky element is clicked
        stickyOn = false;
      } else {
        stickyOn = false; //the tooltip won't move if this is true
        placeInfo(e.originalEvent); //move it to the new spot
        highlight();
        stickyOn = true;
      }
    } else if(!stickyOn || stickyOn && pathID === $selectedPrecinct.attr('id')){ //if sticky, don't highlight others on hover
      highlight();
    }
    function highlight(){
      if ($(window).width() > MOBILE_WIDTH) {
        $('#info-title').html(`<span class="eln-title">${layer.feature.properties.PRECINCT_N} 
            <span class="sub-county">
              ${layer.feature.properties.COUNTY_NAM} COUNTY
        </span>`);

        updateTable('#info-data', layer.feature.properties, year); //this updates the tooltip table
        toggleStrokes(pathID);
        $selectedPrecinct = $(`#${pathID}`);
        $infoTip.show();
      }
    }
  };

  function resetStyle(e) {
    if(!stickyOn){
      if ($(window).width() > MOBILE_WIDTH) {
        $infoTip.hide();
      };
      toggleStrokes();
    }
  };
  /**********************
  * End helper functions 
  ***********************/
};

/**************************************
 * Push precincts from .json file to a list of
 * features so that Leaflet can render them.
**************************************/
function addPrecincts(layer) {
  features = layer;
  console.log(features);
  generateLayers();
  createMap();
  getAggregatedData();
}


/**************************************
 * Add the precincts from the geojson file
 * to the Leaflet map
**************************************/
function createMap() {
  // Add the geoJSON layer to the map
  geojson.addTo(map); 

  $('#county-select').change(function() {
    var value = $(this).val();
    updateFilter(value);
    map.setView({ lat: 33.74, lng: -84.38}, 10);
  })

  createInfo(); // Create the info box that displays precinct information
  $infoTip.hide(); // Infotip is hidden until one of the precincts is clicked
}; 


/**************************************
 * Add event listeners to update the summary
 * table and map when one of the filters is
 * selected
**************************************/
function addFilterListeners() {
  $('.filter-bar, .filter-selected, #demographic-select').each(function() {
    $(this).on('change click', function(e) {
      // Inelegant way of getting the minimaps instead of the select box. < it's not the minimaps but it has to do with the demographic filters not sure how - E
      var value = this.dataset.filter || $(this).val();
      updateFilter(value);
      $filterSelect.val(value);
      map.setView({ lat: 33.74, lng: -84.38}, 10);
    });
  });
};


/**************************************
 * Update the title of the results summary
 * table according to the filter that is
 * currently selected
**************************************/
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

/**************************************
 * Handle updates to the demographic and
 * county filters. Apply fill only to 
 * counties that meet the given criteria
 * (county, demographic filter, or both)
**************************************/
function updateFilter(filterInput) {
  $infoTip.hide(); //in case of sticky tooltip
  stickyOn = false;
  // County filters and demographic filters are both set by this function, 
  // so we need to check if the given filter is a county or not
  var counties = ['Clayton', 'DeKalb', 'Fulton', 'Gwinnett', 'Cobb', 'All counties', 'all counties']
  if (counties.indexOf(filterInput) === -1) {
    selectedBucket = filterInput; // Get the filter from the data-filter attribute
  }
  else {
    selectedCounty = filterInput;
  }

  // Check if each precinct meets the filter criteria,
  // and change its fill color accordingly
  var fcounty = selectedCounty.toUpperCase();

  // Empty the activePrecincts array so that we can fill in only the 
  // precincts that meet the current precinct criteria
  activePrecincts = [];

  // Loop through features in the geoJSON layer (i.e. the precincts)
  geojson.eachLayer(function (layer) {
    layer._path.id = layer.feature.properties['CTYSOSID'];
    var layerRace = layer.feature.properties['race'],
        layerCounty = layer.feature.properties.COUNTY_NAM,
        layerIncome;

    var income = layer.feature.properties['avg_income']; // Assign income to high middle or low bucket

    // Remove precincts that have zero or Null values for both the republican 
    // and the democrat candidate
    if (!layer.feature.properties['dem_votes'] && !layer.feature.properties['rep_votes']) {
      map.removeLayer(layer);
    };

    // Bin the precinct income
    if (income < 50000) {
      layerIncome = 'low';
    }
    else if (income < 100000) {
      layerIncome = 'mid';
    }
    else if (income > 100000) {
      layerIncome = 'high'
    }

    var $path = $(layer._path);
    if (layerCounty === fcounty || fcounty === 'ALL COUNTIES') {
      if (layerRace === selectedBucket ||
        layerIncome === selectedBucket ||
        selectedBucket === 'all') {

        layer.setStyle(setColor(layer.feature));
        toggleStrokes();
        activePrecincts.push(layer);
        $path.removeClass('precinct-hidden');
      }
      else {
       $path.addClass('precinct-hidden');
      };
    }
    else {
      $path.addClass('precinct-hidden');
    };
  });

  // Update the summary table results for the given filter
  updateTitle(selectedBucket);
  updateTable($resultsSummary, aggStats[fcounty][selectedBucket], year);
  updateRankings(activePrecincts, selectedCounty, selectedBucket, year);

  // Add zoom functionality when user clicks one of the top precincts in 
  // the table at the bottom of the page
  $('.rank-row').each(function() {
    $(this).on('click', function(e) {
      stickyOn = true;

      toggleStrokes(this.dataset.precinct);
      $infoTip.hide()
    });
  });
} // End updateFilter()

//deselect previously active precinct and select new one
function toggleStrokes(activeID){
  if ($selectedPrecinct !== undefined){
    $selectedPrecinct.removeClass('precinct-selected');
  }
  if(activeID){
    $selectedPrecinct = $('#'+activeID);
    $selectedPrecinct.addClass('precinct-selected');
  }
}

/**************************************
 * Return an object with appropriate 
 * styles given the vote distribution 
 * of a given precinct
**************************************/
function setColor(feature) {
  // Set default styles
  //if you don't set these you will see flashes of default blue stuff
  var style = {
    fillColor: 'white',
    fillOpacity: 0,
    stroke: 'white',
    className: 'precinct-default'
  };

  var rep = feature.properties.rep_votes,
      dem = feature.properties.dem_votes;

  if (!rep && !dem) {
    return style;
  };
  var party = rep > dem ? 'Republican' : 'Democrat';

  switch (party) {
    case 'Republican': {
      style.fillColor = 'red';
      break;
    }
    case 'Democrat': {
      style.fillColor = '#0040FF';
      break;
    }
  };

  return style;
};


/**************************************
 * Add an info box with information about the
 * currently selected precinct. 
 * **************************************/
function createInfo() {
  // Event handler to change position of tooltip depending on mouse position (on desktop only)
  $('#map').bind('mousemove', function(e) {
    if ($(window).width() > MOBILE_WIDTH) {
      placeInfo(e);
    };
  });
};


/*******************************
 * Set the X and Y coordinates
 * of the infobox
 * ****************************/
function placeInfo(e) {
  var $map = $('#map'),
      mapWidth = $map.width();

  // Move the info tip above the mouse if the user is at the bottom of the screen
  if(!stickyOn){ //only update position if not sticky 
    var x = e.clientX,
        y = e.clientY;
    //if ($mapWidth > MOBILE_WIDTH || e.type == "click") {
    $infoTip.css({left: x + 50, top: y - 20})

    if (y > ($(window).height() - 140)) {
      $infoTip.css({top: y - 100})
    }; //I don't think this works in the iFrame

    if (x > (mapWidth - 200)) {
      $infoTip.css({left: mapWidth - 200, top: y + 50})
    };
      //};
  }

  // Event handler to change display of tooltip for mobile or desktop on
  // window resize
  $(window).resize(function() {
    $infoTip.hide();
    toggleMobile();
  });

  // Hide info tip when mobile close button is clicked
  $closeButton.on('click', function() {
    $infoTip.hide();
  })

};

/**************************************
 * Hover the precinct infobox or fix it to 
 * the screen depending on the size of
 * the display
 * **************************************/
function toggleMobile() {
  if ($(window).width() < MOBILE_WIDTH) {
    $closeButton.show();
    $infoTip.css({left: '', top: ''}); // Remove css styles added by mousemove event handler
    $infoTip.toggleClass('follow', false);
  }
  else {
    $closeButton.hide();
    $infoTip.toggleClass('follow', true); //does this do something?
  };
};


/**************************************
 * Pan the map to an address selected by
 * the user
 * **************************************/
function onPlaceChanged() { //should probably update this highlight rather than zoom
  $infoTip.hide(); //in case it's sticky
  stickyOn = false;
  var lat = autocomplete.getPlace().geometry.location.lat();
  var lng = autocomplete.getPlace().geometry.location.lng();
  map.setView(new L.LatLng(lat, lng), 15);
};


function main() {
  getMetadata();
  toggleMobile();
  getTiles();
  initInput();
  getPrecincts(addPrecincts, year);
  map._onResize(); // Bug http://stackoverflow.com/questions/24547468/leaflet-map-on-hide-div
};


main();
