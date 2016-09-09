import * as L from 'leaflet';
import $ from 'jquery';

var map = L.map('map').setView([30.267, -97.743], 12);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  maxZoom: 18,
  id: 'mapbox.streets',
  accessToken: 'pk.eyJ1IjoiZ2Vlemhhd2siLCJhIjoiY2ltcDFpY2dwMDBub3VtbTFkbWY5b3BhMSJ9.4mN7LI5CJMCDFvqkx1OJZw'
}).addTo(map);

var precinctBoundary = new L.geoJson();
precinctBoundary.addTo(map);

$.ajax({
  dataType: 'json',
  url: './precincts.geojson',
  success: function(data) {
    $(data.features).each(function(key, data) {
      precinctBoundary.addData(data);
      console.log(data);
    });
  },
  failure: function() {
    console.log('get failed');
  }
});
