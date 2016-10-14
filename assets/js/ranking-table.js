// Third party libraries
import $ from 'jquery';
import _ from 'underscore';

// DOM refs
var $rankTableDem = $('#rank-table-dem-body'),
    $rankTableRep = $('#rank-table-rep-body'),
    $title = $('#top-precincts-title');

// State
var sortedPrecincts;

// Constants
var filters = {
  'white': 'at least 50% white population',
  'black': 'at least 50% black population',
  'hispanic': 'at least 50% Hispanic population',
  'high': 'a mean household income above $100,000',
  'mid': 'a mean household income between $50,000 and $100,000',
  'low': 'a mean household income below $50,000'
};


// Use only active precincts in table.
export default function(activePrecincts, county, filter) {
  console.log(county)
  // Set the title
  var f = filters[filter];
  var titleText;

  if ((county == 'All counties' || county == 'all counties') && filter == 'all') {
    titleText = 'All Precincts';
  }
  else if (county == 'all counties' || county == 'All counties') {
    titleText = 'Precincts with ' + f;
  }
  else if (filter == 'all') {
    titleText = county + ' County';
  }
  else {
    titleText = 'Precincts with ' + f + ' in ' + county.split()[0] + ' County';
  };

  $title.html(`
     Top Precincts for Each Candidate
     <span id='ranking-subhed'>
       ${titleText}
     </span>
  `)
  if (activePrecincts.length >= 10) {
    sortedPrecincts = _.sortBy(activePrecincts, function(p) {
      return p.feature.properties.rep_p;
    });
  };
  
  var parties = {topRep: [], topDem: []};

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
  return;
};

function createRankDiv(parties) {
  // Clear the inner HTML of the ranking table
  $rankTableRep.html('');
  $rankTableDem.html('');

  // Show the top 5 precincts for each candidate, given the
  // current filters
  for (var i = 0; i < 5; i++) {
    var repPrecinct = parties.topRep[i].feature
    var demPrecinct = parties.topDem[i].feature

    var demVotes = parseInt(demPrecinct.properties.dem_p*100);
    var repVotes = parseInt(repPrecinct.properties.rep_p*100);

    // Add the tables
    $rankTableDem.append(`
      <tr>
        <td class="rank">${i+1}</td>
        <td class="proportion">
          <div>
            ${demPrecinct.properties.PRECINCT_N} 
          </div>
          <div class="rank-sub-county">
            ${demPrecinct.properties.COUNTY_NAM}
          </div>
        </td>

        <td>${demVotes}%</td>

      </tr>
    `);

    $rankTableRep.append(`
      <tr>
        <td class="rank">${i+1}</td>
        <td class="proportion">
          <div>
            ${repPrecinct.properties.PRECINCT_N} 
          </div>
          <div class="rank-sub-county">
            ${repPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
        <td>${repVotes}%</td>
      </tr>
    `);
  };
};
