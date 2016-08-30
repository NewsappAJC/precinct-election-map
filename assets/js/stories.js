import React from 'react';
import '../img/kitten.jpg';

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

export default class extends React.Component {
  constructor() {
    super();
    this.stories = STORIES;
  }
  render() {
    var nodes = this.stories.map((story) => {
      return (
          <div className="small-12 medium-6 columns all-stories">
            <a href={story.link}>
              <div className="story-card row">
                <div className="medium-4 columns">
                  <img className="thumbnail"src={'../img/' + story.thumb}/>
                </div>
                <div className="medium-8 columns">
                  <div className="story-title">
                    {story.hed}
                  </div>
                  <div className="story-tease">
                    {story.tease}
                  </div>
                </div>
              </div>
            </a>
          </div>
      )
    })
    return (
      <div>
        <h1 id="stories-header">Related Stories</h1>
        <div className="row">
          {nodes}
        </div>
      </div>
        )
  }
}
