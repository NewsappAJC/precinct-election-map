// Third party libraries
import $ from 'jquery';
import _ from 'underscore';

// DOM refs
var $rankTableDem = $('#rank-table-dem-body'),
    $rankTableRep = $('#rank-table-rep-body'),
    $title = $('#top-precincts-title'),
    $demTitle = $('#dem-rank-title'),
    $repTitle = $('#rep-rank-title');

// State
var sortedPrecinctsRep,
    sortedPrecinctsDem;

// Constants
var filters = {
  'white': 'at least 50% white population',
  'black': 'at least 50% black population',
  'hispanic': 'at least 50% Hispanic population',
  'high': 'a mean household income above $100,000',
  'mid': 'a mean household income between $50,000 and $100,000',
  'low': 'a mean household income below $50,000'
};

var candidates = {
  2012: {rep: 'Romney', dem: 'Obama'},
  2016: {rep: 'Trump', dem: 'Clinton'}
}


export default function(activePrecincts, county, filter, year) {
  // Update the titles
  $demTitle.html(candidates[year]['dem']);
  $repTitle.html(candidates[year]['rep']);

  // Set the subhed
  var f = filters[filter],
      titleText,
      fcounty = county.toUpperCase()

  if (fcounty === 'ALL COUNTIES' && filter === 'all') {
    titleText = 'Metro Atlanta';
  }
  else if (fcounty === 'ALL COUNTIES') {
    titleText = 'Precincts with ' + f;
  }
  else if (filter === 'all') {
    titleText = county + ' County';
  }
  else {
    titleText = 'Precincts with ' + f + ' in ' + county.split()[0] + ' County';
  };

  $title.html(`
     Top Precincts
     <div class="instructions"> Select a precinct to zoom in </div>
     <span id='ranking-subhed'>
       ${titleText}
     </span>
  `)
  if (activePrecincts.length >= 10) {
    sortedPrecinctsRep = _.sortBy(activePrecincts, function(p) {
      // Check that the coordinates are always nested like this
      var prop = p.feature.properties.rep_p
      // Handle undefined values
      if (prop === undefined || p.feature.properties.rep_votes < 50) {
        return 0;
      };
      return prop;
    }).reverse();
    sortedPrecinctsDem = _.sortBy(activePrecincts, function(p) {
      var prop = p.feature.properties.dem_p
      if (prop === undefined || p.feature.properties.dem_votes < 50) {
        return 0;
      };
      return prop;
    }).reverse();
  };
  
  // Populate the table
  var parties = {topRep: [], topDem: []};

  _.each(parties, function(value, key, obj) {
    for (var i = 0; i < 5; i++) {
      if (key === 'topDem') {
        obj[key].push(sortedPrecinctsDem[i]);
      }
      else {
        obj[key].push(sortedPrecinctsRep[i]);
      }
    };
  });

  createRankDiv(parties);
  return;
};

function createRankDiv(parties) {
  // Clear the inner HTML of the ranking table
  $rankTableRep.html('');
  $rankTableDem.html('');

  // Set starting value to 101 so that first 
  // election result is guaranteed to be a smaller value
  //but what is it for? And what is the "first" election result and why do we want it to be smaller anyway? 
  var prevDem = 101,
      prevRep = 101,
      demCounter = 0,
      repCounter = 0;

  // Display the top 5 precincts for each candidate in the table, given the
  // current filters
  for (var i = 0; i < 5; i++) {
    var repPrecinct = parties.topRep[i].feature
    var demPrecinct = parties.topDem[i].feature

    // Yeah, getting the first point is arbitrary, but calculating the 
    // center of each precinct would require a little more work
    //var repZoomPoint = repPrecinct.geometry.coordinates[0][0][0];
    //var demZoomPoint = demPrecinct.geometry.coordinates[0][0][0];

    var demVotes = parseInt(demPrecinct.properties.dem_p*100);
    var repVotes = parseInt(repPrecinct.properties.rep_p*100);

    // Only increment the rank if the pct is actually greater
    if (demVotes < prevDem) {
      prevDem = demVotes;
      demCounter += 1;
    };

    if (repVotes < prevRep) {
      prevRep = repVotes;
      repCounter += 1;
    };

    // Add the tables
    $rankTableDem.append(`
      <tr class="rank-row" 
          data-precinct=${demPrecinct.properties.CTYSOSID}>
        <td class="rank">${demCounter}</td>
        <td class="neighborhood">
          <div>
            ${demPrecinct.properties.PRECINCT_N} 
          </div>
          <div class="rank-sub-county">
            ${demPrecinct.properties.COUNTY_NAM}
          </div>
        </td>

        <td class="proportion">${demVotes}%</td>

      </tr>
    `);

    $rankTableRep.append(`
      <tr class="rank-row"
          data-precinct=${repPrecinct.properties.CTYSOSID}>
        <td class="rank">${repCounter}</td>
        <td class="neightborhood"
          <div>
            ${repPrecinct.properties.PRECINCT_N} 
          </div>
          <div class="rank-sub-county">
            ${repPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
        <td class="proportion">${repVotes}%</td>
      </tr>
    `);
  };
};
