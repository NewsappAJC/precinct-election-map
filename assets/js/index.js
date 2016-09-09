import * as L from 'leaflet';
import $ from 'jquery';

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

var features = [];

// Set the color of the precinct polygon and append to the 
// map.
function drawPrecincts(precincts) {
  $(precincts).each(function(key, feature) {
    features.push(feature);
  });

  L.geoJson(features, {style: function(feature) {
      switch (feature.properties.party) {
        case 'Republican': return {color: 'red'};
        case 'Democrat': return {color: 'blue'};
      };
    }
  }).addTo(map);
};

getPrecincts(drawPrecincts)
