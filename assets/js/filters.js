import $ from 'jquery';

export default function() {
  var buckets = [
    ['all', 'All'],
    ['white', 'White'],
    ['black', 'Black'],
    ['hispanic', 'Hispanic'],
    ['high', 'Over $100,000'],
    ['middle', '$50,000 to $100,000'],
    ['low', 'Under $50,000']
  ];

  for (var i = 0; i < buckets.length; i++) {
    $('#filters').append(
      `<a class="filter" data-filter=${buckets[i][0]}>
        <img src="./img/map.png"/>
        <span class="filter-title">
          ${buckets[i][1]}
        </span>
      </a>
      `
    )
  }
}
