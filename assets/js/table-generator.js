import $ from 'jquery';

// Constants
var candidates = {
  2012: {rep: 'Romney', dem: 'Obama'},
  2016: {rep: 'Trump', dem: 'Clinton'}
}

export default function(el, props, year) {
  console.log('updating tables')
  try {
    var totalVotes = props.dem_votes + props.rep_votes;

    function getCandResults(party, numVotes) { 
      return `
          <tr class="eln-summary-row">
            <td>
              <div class="${party}-party-tag"></div>
              <span class="candidate-name">${party === 'dem' ? candidates[year]['dem']: candidates[year]['rep']}</span>
            </td>
            <td>${numVotes}</td>
            <td>${parseInt((numVotes / totalVotes) * 100)}%</td> 
          </tr>
      `
    }

    var winner;
    var loser;

    if (props.dem_votes > props.rep_v) {
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
