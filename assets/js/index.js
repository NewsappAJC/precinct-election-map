import * as L from 'leaflet';
import $ from 'jquery';

var API_KEY = 'AIzaSyDvnItP2gpOElUCZzMccS5TySlDNgpeZb8';

var map = L.map('map').setView([33.7, -84.3], 12);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  maxZoom: 18,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZ2Vlemhhd2siLCJhIjoiY2ltcDFpY2dwMDBub3VtbTFkbWY5b3BhMSJ9.4mN7LI5CJMCDFvqkx1OJZw'
}).addTo(map);

// Get shapefiles.
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


// Set the color of the precinct polygon and append to the 
// map.
function drawPrecincts(precincts) {
  var features = [];

  $(precincts).each(function(key, feature) {
    features.push(feature);
  });

  L.geoJson(features, {
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

  var info = L.control();

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
      console.log('whatever');
    }
  };

  info.addTo(map);
  
  function onEachFeature(feature, layer) {
    layer.on({
      click: zoomToFeature,
      mouseover: highlightFeature,
      mouseout: resetStyle
    })
  };

  function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      stroke: true,
      weight: 2,
      color: 'black',
      opacity: 1
    });

    info.update(layer.feature.properties);
  }

  function resetStyle(e) {
    e.target.setStyle({stroke: false});
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }
};

/* Add event listeners to autocomplete input field and query Google
 * Places API */
var autocomplete; 

function initInput() {
  // var defaultBounds = TKTK;

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

initInput();
getPrecincts(drawPrecincts)

