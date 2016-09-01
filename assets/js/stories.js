import $ from 'jquery';

const STORIES = [
  {hed: 'Atlanta officer fired',
    tease: 'Deravis Caine Rogers, suspected of breaking into cars, was shot by an officer...',
    dateline: 'July 8th, 2016',
    thumb: 'apd_car_shooting.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/atlanta-officer-fired-as-shooting-at-cars-by-polic/nrtwD/'
  },
  {hed: 'Murder charge against Atlanta cop',
    tease: 'Atlanta’s top law enforcement leaders this month quickly brought criminal charges...',
    dateline: 'July 16th, 2016',
    thumb: 'JamesBurnscollage.jpg',
    link: 'http://www.myajc.com/news/news/murder-charge-against-atlanta-cop-shifts-ground-in/nrzHy/'
  },
  {hed: 'New details in deadly police shooting',
    tease: 'The Atlanta Police Department’s internal affairs investigation contains damning new information...',
    dateline: 'July 13th, 2016',
    thumb: 'Deravis-Caine-Rogers-photo.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/new-details-in-deadly-police-shooting-of-black-man/nrx6L/'
  },
  {hed: 'Arrest warrants issued',
    tease: 'Fulton County District Attorney Paul Howard announced that arrest warrants were issued Friday...',
    dateline: 'July 15th, 2016',
    thumb: 'Officer-James-Burns.jpg',
    link: 'http://www.myajc.com/news/news/breaking-news/atlanta-cop-who-shot-unarmed-black-man-charged-wit/nry7G/'
  }
]

export default class {
  constructor() {
    this.data = STORIES;
  };

  render() {
    this.data.forEach((story) => {
      $('#stories').append(`
          <div class="small-12 medium-6 columns all-stories">
            <a href=${story.link} target="_blank", rel="noopener">
              <div class="story-card">
                <div class="row">
                  <div class="medium-4 columns">
                    <img class="thumbnail"src=${'img/' + story.thumb}/>
                  </div>
                  <div class="medium-8 columns">
                    <h4 class="story-title">
                      ${story.hed}
                    </h4>
                    <div class="dateline">
                      ${story.dateline}
                    </div>
                    <div class="story-tease">
                      ${story.tease}
                    </div>
                  </div>
                </div>
              </div>
            </a>
          </div>
      `);
    });
  };
};
