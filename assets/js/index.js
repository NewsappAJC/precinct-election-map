import * as L from 'leaflet';
import $ from 'jquery';

var API_KEY = 'AIzaSyDvnItP2gpOElUCZzMccS5TySlDNgpeZb8';

var autocomplete;
var features = [];
var geojsonLayer;
var info;
var map = L.map('map').setView([33.7, -84.3], 10);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  maxZoom: 18,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZ2Vlemhhd2siLCJhIjoiY2ltcDFpY2dwMDBub3VtbTFkbWY5b3BhMSJ9.4mN7LI5CJMCDFvqkx1OJZw'
}).addTo(map);


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

  createMap();
}


/* Generate a map and a list of filter options */
function createMap() {
  generateLayers(features)

  // Add event listeners to filter precincts by certain criteria.
  $('.filter').each(function(i, feature) {
    feature.addEventListener('click', function() {
      var filter = this.dataset.filter;
      geojsonLayer.clearLayers();
      var nfeatures = [];
      if (filter === 'all') {
        nfeatures = features;
      }
      else {
        features.forEach((f) => {
          if (f.properties.race == filter || f.properties.median_income == filter) {
            nfeatures.push(f);
          };
        });
      }
      generateLayers(nfeatures); // Generate a new layer with the filtered precincts
      map.setView([33.7, -84.3], 10);
    })
  })

  createInfo();
}


/* generate a geoJson layer from the data and add event listeners. */
function generateLayers(f) {
  geojsonLayer = L.geoJson(f, {
    onEachFeature: onEachFeature, 
    style: function(feature) {
      var style = {stroke: false};
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
  }).addTo(map);

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
      stroke: true,
      weight: 2,
      color: 'black',
      opacity: 1
    });

    info.update(layer.feature.properties);
  };

  function resetStyle(e) {
    e.target.setStyle({stroke: false});
  };

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  };
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

