import $ from 'jquery';

export default function() {
  var buckets = [
    ['all', 'All'],
    ['white', 'White'],
    ['black', 'Black'],
    ['hispanic', 'Hispanic'],
    ['high', 'Over $100k'],
    ['mid', '$50k to $100k'],
    ['low', 'Under $50k']
  ];

  var counties = [
    'All counties',
    'Fulton',
    'DeKalb',
    'Clayton',
    'Cobb',
    'Gwinnett',
  ]

  for (var i = 0; i < counties.length; i++) {
    // Append to counties selector
    $('#county-select').append(`
        <option value="${counties[i]}">${counties[i]}</option>
    `)
  }

  for (var i = 0; i < buckets.length; i++) {
    // Append to selector that appears on desktop
    $('#filters').append(`
      <a class="filter" data-filter=${buckets[i][0]}>
        <img src="./img/all.png"/>
        <span class="filter-title">
          ${buckets[i][1]}
        </span>
      </a>
    `)


    // Append to selector that displays on mobile.
    $('#filter-select').append(`
        <option value="${buckets[i][0]}">${buckets[i][1]}</option>
    `)
  }

}
