import updateSummary from './summary';
import makeFilters from './filters';
import * as L from 'leaflet';
import $ from 'jquery';

// Set variables for this project
var autocomplete;
var selectedBucket = 'all';
var features = [];
var geojsonLayer;
var info;

// Create map and get tiles from custom map on MapBox
var map = L.map('map').setView([33.7, -84.3], 10);

// Fanciness to render a pane with place labels on top of the GeoJSON layers.
var bottomLayer=  L.tileLayer('https://api.mapbox.com/styles/v1/geezhawk/cit35fj1h000b2xs6g75pyon7/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2Vlemhhd2siLCJhIjoiY2ltcDFpY2dwMDBub3VtbTFkbWY5b3BhMSJ9.4mN7LI5CJMCDFvqkx1OJZw').addTo(map);
var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
var topLayer = L.tileLayer('http://c.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png').addTo(map);
topPane.appendChild(topLayer.getContainer());
topLayer.setZIndex(9);

/* Get shapefiles */
function getPrecincts(cb) {
  $.ajax({
    dataType: 'json',
    url: './atlanta-precincts.json',
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
  generateLayers();
  createMap();
}


/* Generate a map and a list of filter options */
function createMap() {
  // Render filters
  makeFilters();
  $('.filter[data-filter="all"]').attr('class', 'filter-selected');

  // Default to display all precincts without any filtering
  geojsonLayer.addTo(map);
  updateSummary('all');


  // Add event listeners to filter precincts by certain criteria.
  $('.filter, .filter-selected').each(function() {
    $(this).on('click', function() {
      // Update the layers on the map
      selectedBucket= this.dataset.filter;

      geojsonLayer.eachLayer(function (layer) {
        var layerParty = layer.feature.properties.party;
        var layerRace = layer.feature.properties.race;
        var layerIncome = layer.feature.properties.median_income;

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
      style.stroke = 'red';
      style.opacity = .3;
      style.weight = 1;
      break;
    }
    case 'Democrat': {
      style.fillColor = 'blue';
      style.stroke = 'blue';
      style.opacity = .3;
      style.weight = 1;
      break;
    }
  };
  return style;
};


/* generate a geoJson layer from the data and add event listeners. */
function generateLayers() {
  geojsonLayer = L.geoJson(features, {
      onEachFeature: onEachFeature, 
      style: function(feature) { 
        var style = {stroke: false};
        switch (feature.properties.party) {
          case 'Republican': {
            style.fillColor = 'red';
            style.stroke = 'grey';
            style.opacity = .2;
            style.weight = 1;
            break;
          }
          case 'Democrat': {
            style.fillColor = 'blue';
            style.stroke = 'grey';
            style.opacity = .2;
            style.weight = 1;
            break;
          }
        };
        return style;
      }
    }
  );


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
      color: 'black',
      opacity: 1
    });

    info.update(layer.feature.properties);
  };

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  };

  function resetStyle(e) {
    var layer = e.target;

    layer.setStyle({
      stroke: 'grey',
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
  info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  info.update = function (props) {
    try {
      this._div.innerHTML = `
        <h4 class="candidate-table-title">${props.NAMELSAD10}</h4>
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
      `;
    }
    catch (TypeError) {
      console.log('no data');
    }
  };

  info.addTo(map);
};


/* Add event listeners to autocomplete input field and query Google
 * Places API */
function initInput() {
  var input = document.getElementById('autocomplete');
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


