import $ from 'jquery';

// Constants
var candidates = {
  2012: {rep: 'Romney', dem: 'Obama'},
  2016: {rep: 'Trump', dem: 'Clinton'}
}

export default function(el, props, year) {

  // Set the title
  $('#info-title').html(`<span class="eln-title">${props.PRECINCT_N} 
      <span class="sub-county">
        ${props.COUNTY_NAM} COUNTY
  </span>`);

  /* Helper function */
  function wCommas(string_) {
      return string_.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  try {
    var totalVotes = props.dem_votes + props.rep_votes;

    function getCandResults(party, numVotes) { 
      return `
          <tr class="eln-summary-row">
            <td>
              <div class="${party}-party-tag"></div>
              <span class="candidate-name">${party === 'dem' ? candidates[year]['dem']: candidates[year]['rep']}</span>
            </td>
            <td>${wCommas(numVotes)}</td>
            <td>${parseInt((numVotes / totalVotes) * 100)}%</td> 
          </tr>
      `
    }

    var winner;
    var loser;

    if (props.dem_votes > props.rep_votes) {
      winner = getCandResults('dem', props.dem_votes)
      loser = getCandResults('gop', props.rep_votes)
    }
    else {
      winner = getCandResults('gop', props.rep_votes)
      loser = getCandResults('dem', props.dem_votes)
    }

    $(el).html(`
      <table class="eln-summary-table">
        <thead class="eln-summary-header">
          <tr>
            <th>Candidates</th>
            <th>Votes</th>
            <th>Pct.</th>
          </tr>
        </thead>
        <tbody>
          ${winner}
          ${loser}
        </tbody>
      
      </table>
    `);
  }
  catch (TypeError) {
    $('#info-data').html = '<h1>Hover over a precinct to see details</h1>'
  }
};
