import * as d3 from 'd3';

const STORIES = [
  {hed: 'Test', 
    tease: 'This is a test article. A user clicks this link to navigate to a story', 
    thumb: 'kitten.jpg',
    link: 'http://ajc.com'
  },
  {hed: 'Test', 
    tease: 'This is a test article. A user clicks this link to navigate to a story', 
    thumb: 'kitten.jpg',
    link: 'http://ajc.com'
  },
  {hed: 'Test', 
    tease: 'This is a test article. A user clicks this link to navigate to a story', 
    thumb: 'kitten.jpg',
    link: 'http://ajc.com'
  },
  {hed: 'Test', 
    tease: 'This is a test article. A user clicks this link to navigate to a story', 
    thumb: 'kitten.jpg',
    link: 'http://ajc.com'
  },
]

export default class {
  constructor() {
    this.data = STORIES;
  };

  render() {
    var stories = d3.select('#stories');

    var storyNodes = stories.selectAll('div')
      .data(this.data)
        .enter()
      .append('div')
      .attr('class', 'small-12 medium-6 columns all-stories');

    var cards = storyNodes.append('a')
      .attr('href', (d) => d.link)
        .append('div')
      .attr('class', 'story-card row');

    cards.append('div')
      .attr('class', 'medium-4 columns')
        .append('img')
      .attr('class', 'thumbnail')
      .attr('src', (d) => `../img/${d.thumb}`);

    var text = cards.append('div')
      .attr('class', 'medium-8 columns');

    text.append('div')
      .attr('class', 'story-title')
      .text((d) => d.hed);

    text.append('div')
      .attr('class', 'story-tease')
      .text((d) => d.tease);

  }
}
