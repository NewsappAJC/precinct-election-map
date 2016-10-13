// Third party libraries
import $ from 'jquery';

// DOM refs
var $rankingTable = $('#rank-table-body')

// State
var sortedPrecincts;

export default function(activePrecincts) {
  if (activePrecincts.length >= 10) {
    sortedPrecincts = _.sortBy(activePrecincts, function(p) {
      return p.feature.properties.rep_p
    });
  };
  
  var parties = {topRep: [], topDem: []};
  console.log(sortedPrecincts)

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
  return
};

function createRankDiv(parties) {
  $rankingTable.html('');
  for (var i = 0; i < 5; i++) {
    var repPrecinct = parties.topRep[i].feature
    var demPrecinct = parties.topDem[i].feature

    var demVotes = parseInt(demPrecinct.properties.dem_p*100);
    var repVotes = parseInt(repPrecinct.properties.rep_p*100);

    $rankingTable.append(`
      <tr>
        <td class="rank">${i+1}</td>
        <td class="proportion">
          <div>
            ${demPrecinct.properties.PRECINCT_N} 
            <strong>
              - ${demVotes}%
            </strong>
          </div>
          <div class="rank-sub-county">
            ${demPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
        <td class="proportion">
          <div>
            ${repPrecinct.properties.PRECINCT_N} 
            <strong>
              - ${repVotes}%
            </strong>
          </div>
          <div class="rank-sub-county">
            ${repPrecinct.properties.COUNTY_NAM}
          </div>
        </td>
      </tr>
    `);
  };
};
