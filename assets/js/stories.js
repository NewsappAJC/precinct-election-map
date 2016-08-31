import * as d3 from 'd3';

const STORIES = [
  {hed: 'Murder charge against Atlanta cop', 
    tease: 'Atlanta’s top law enforcement leaders this month...quickly brought criminal and disciplinary charges against an Atlanta cop who killed an unarmed black motorist.',
    thumb: 'kitten.jpg',
    link: 'http://www.myajc.com/news/news/murder-charge-against-atlanta-cop-shifts-ground-in/nrzHy/', 
  },
  {hed: 'Arrest warrants issued', 
    tease: 'Fulton County District Attorney Paul Howard announced that arrest warrants were issued Friday for the ex-Atlanta police officer...', 
    thumb: 'kitten.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/atlanta-cop-who-shot-unarmed-black-man-charged-wit/nry7G/'
  },
  {hed: 'New details in deadly police shooting', 
    tease: 'The Atlanta Police Department’s internal affairs investigation into the fatal shooting of an unarmed black man by one of its officers last month contains damning new information...', 
    thumb: 'kitten.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/new-details-in-deadly-police-shooting-of-black-man/nrx6L/'
  },
  {hed: 'Atlanta officer fired', 
    tease: 'Deravis Caine Rogers, suspected of breaking into cars, drove away last month when an Atlanta police officer fired at his silver sedan, striking Rogers in the head.', 
    thumb: 'kitten.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/atlanta-officer-fired-as-shooting-at-cars-by-polic/nrtwD/'
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
