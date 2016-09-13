import $ from 'jquery';

export default function(filter) {
  var map = [
    ['white', 'at least 50% white population'],
    ['black', 'at least 50% black population'],
    ['hispanic', 'at least 50% Hispanic population'],
    ['rich', 'an average income above $100,000'],
    ['middle', 'an average income between $50,000 and $100,000'],
    ['poor', 'an average income below $50,000']
  ];

  $('#results-summary-title').empty();
  $('#results-summary-title').append(`Atlanta results`);

  map.forEach((el) => {
    if (el[0] === filter) {
      $('#results-summary-title').empty();
      $('#results-summary-title').append(`Results in areas with ${el[1]}.`);

      $('#results-summary-table').empty();
      $('#results-summary-table').append(`
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
      `)
    };
  });
};
