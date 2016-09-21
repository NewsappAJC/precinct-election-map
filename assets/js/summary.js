// Third-party modules
import $ from 'jquery';

// Local modules
import updateSummary from './table-generator';

export default function(filter) {
  /*
  var buckets = [
    {'all', 'Atlanta Results', 123, 123, '367,123'],
    {'white', 'at least 50% white population', 123, 123, '231,412'],
    {'black', 'at least 50% black population', 125, 126, '231,412'],
    {'hispanic', 'at least 50% Hispanic population', 124, 128, '231,412'],
    {'high', 'an average household income above $100,000', 120, 120, '231,412'],
    {'middle', 'an average household income between $50,000 and $100,000', 123, 128, '231,412'],
    ['low', 'an average household income below $50,000', 124, 128, '231,412']
  ];
  */
  updateSummary('#results-summary-table', bucket);

  buckets.forEach((bucket) => {
    if (bucket[0] === filter) {
      /*
      $title.empty();
      if (filter === 'all') {
        $title.append(`Atlanta results`);
      }
      else {
        $title.append(`Results in areas with ${el[1]}.`);
      }
      */
    };
  });
};
