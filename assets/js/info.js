import $ from 'jquery';

export default function updateInfo(props) {
  try {
    $('#info-data').html(`
      <h4 class="tooltip-title">Precinct ${props.PRECINCT_I} (${props.COUNTY_NAM})</h4>
      <table class="tooltip-table">
        <thead class="eln-header">
          <tr>
            <th>Candidates</th>
            <th>Votes</th>
            <th>Pct.</th>
          </tr>
        </thead>
        <tbody>
          <tr class="tooltip-row">
            <td>
              <div class="dem-party-tag"></div>
              <span class="candidate-name">Clinton</span>
            </td>
            <td>586,015</td>
            <td>35.4</td> 
          </tr>
          <tr class="eln-row">
            <td>
              <div class="gop-party-tag"></div>
              <span class="candidate-name">Trump</span>
            </td>
            <td>586,015</td>
            <td>35.4</td> 
          </tr>
        </tbody>
      
      </table>
    `);
  }
  catch (TypeError) {
    $('#info-data').html = '<h1>Hover over a precinct to see details</h1>'
  }
};
