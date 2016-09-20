import $ from 'jquery';

export default function(filter) {
  var $table = $('#results-summary-table');
  var $title = $('#results-summary-title');
  var $participation = $('#participation');

  var map = [
    ['all', 'Atlanta Results', 123, 123, '367,123'],
    ['white', 'at least 50% white population', 123, 123, '231,412'],
    ['black', 'at least 50% black population', 125, 126, '231,412'],
    ['hispanic', 'at least 50% Hispanic population', 124, 128, '231,412'],
    ['high', 'an average household income above $100,000', 120, 120, '231,412'],
    ['middle', 'an average household income between $50,000 and $100,000', 123, 128, '231,412'],
    ['low', 'an average household income below $50,000', 124, 128, '231,412']
  ];

  $title.empty();

  map.forEach((el) => {
    if (el[0] === filter) {
      $title.empty();
      if (filter === 'all') {
        $title.append(`Atlanta results`);
      }
      else {
        $title.append(`Results in areas with ${el[1]}.`);
      }

      $table.empty();
      $table.append(`
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
        <span class="participation">${el[4]} votes</span><br>
        <span class="participation">${el[2]} of ${el[3]} precincts reported votes</span>
      `)
    };
  });
};
