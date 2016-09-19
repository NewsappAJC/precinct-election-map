// Third party libraries
import * as L from 'leaflet';
import $ from 'jquery';

// Local modules
import updateSummary from './summary';
import makeFilters from './filters';

// Set variables for this project
var autocomplete;
var selectedBucket = 'all';
var features = [];
var geojson;
var interactiveLayer;
var app;
var $infoTip;

// Create map and get tiles from Carto
var map = L.map('map');
map.setView({ lat: 33.74, lng: -84.38}, 10)

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
    url: './atl-final-fmtd.json', // can also be './atlanta-precincts.json'
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

  // Add event listeners to filter precincts by certain criteria.
  $('.filter, .filter-selected').each(function() {
    $(this).on('click', function() {
      // Update the layers on the map
      selectedBucket = this.dataset.filter;

      geojson.eachLayer(function (layer) {
        var layerParty = layer.feature.properties.party;
        var layerRace = layer.feature.properties.summarized;
        var layerIncome = layer.feature.properties.income;

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
      style.stroke = 'grey';
      style.opacity = .3;
      style.weight = 1;
      break;
    }
    case 'Democrat': {
      style.fillColor = 'blue';
      style.stroke = 'grey';
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
        var style = {stroke: 'grey', fillOpacity: .3, opacity: .3, weight: 1};
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
      opacity: 1
    });

    updateInfo(layer.feature.properties);
  };

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  };

  function resetStyle(e) {
    var layer = e.target;

    layer.setStyle({
      opacity: .2,
      weight: 1
    })
  }
  /**********************
  * End helper functions 
  ***********************/
};


/* Add an info box to the main map */
function createInfo() {
  $infoTip = $('#info');
  $('#map').bind('mousemove', function(e) {
    $infoTip.css({left: e.pageX - 150, top: e.pageY - 175})
  })
}

function updateInfo(props) {
  console.log('updating info box')
  try {
    $infoTip.html(`
      <h4 class="candidate-table-title">${props.CTYSOSID}</h4>
      <table class="candidate-table">
        <thead>
          <tr>
            <th class='eln-header'>Candidates</th>
            <th class='eln-header'>Votes</th>
            <th class='eln-header'>Pct.</th>
          </tr>
        </thead>
        <tbody>
          <tr class="eln-row">
            <td>
              <div class="dem-party-tag"></div>
              <span class="candidate-name">Hillary Clinton</span>
            </td>
            <td>586,015</td>
            <td>35.4</td> 
          </tr>
          <tr class="eln-row">
            <td>
              <div class="gop-party-tag"></div>
              <span class="candidate-name">Donald Trump</span>
            </td>
            <td>586,015</td>
            <td>35.4</td> 
          </tr>
        </tbody>
      
      </table>
    `);
  }
  catch (TypeError) {
    infoTip.html = '<h1>Hover over a precinct to see details</h1>'
  }
};

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

