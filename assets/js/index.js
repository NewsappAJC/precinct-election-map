import * as L from 'leaflet';
import * as d3 from 'd3';
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

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: mouseover,
      mouseout: mouseout
    })
  };

  function mouseover(e) {
    e.target.setStyle({
      stroke: true,
      weight: 2,
      color: 'black',
      opacity: 1
    });
  }

  function mouseout(e) {
    e.target.setStyle({stroke: false});
  }
};

getPrecincts(drawPrecincts)
