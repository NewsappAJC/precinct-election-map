import $ from 'jquery';

export default function() {
  var buckets = [
    ['all', 'All precincts'],
    ['white', 'White'],
    ['black', 'Black'],
    ['hispanic', 'Hispanic'],
    ['high', 'Over $100k'],
    ['middle', '$50k to $100k'],
    ['low', 'Under $50k']
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
