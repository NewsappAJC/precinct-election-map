import ProgressBar from './progress-bar';
import Canvas from './canvas';
import Stories from './stories';
import React from 'react';
import ReactDOM from 'react-dom';
import '!style!css!sass!../css/vendor/foundation.min.css';
import '!style!css!sass!../css/style.scss';
import '../img/ajc-logo.png';
import '../img/title-card.png';

const DATA = [
  {desc: 'This is Stepr. It\'s a responsive single-page app that displays a sequence of events',
    title: 'First step',
    x: 20, y: 50},
  {desc: 'The user clicks, taps, or uses the arrow keys to step through the events',
    title: 'Second step',
    x: 50, y: 40},
  {desc: 'Circles overlaid on a map/aerial photo show where each event took place', 
    title: 'Third step',
    x: 75, y: 20},
  {desc: 'A progress bar at the top of the screen tracks how far the user has left to go',
    title: 'Fourth step',
    x: 43, y: 80},
  {desc: 'It can be hard to convey spatial logic with words. But with Stepr it\'s easy',
    title: 'Fifth step',
    x: 15, y: 40},
  {desc: 'Try it out on mobile - it\'s responsive!',
    title: 'Sixth step',
    x: 43, y: 80},
  {desc: 'Just make sure that the photo you upload has an aspect ratio of 5:6',
    title: 'Seven here',
    x: 90, y: 20},
  {desc: 'That\'s it. Try it out in one of your stories!',
    title: 'Wow eight',
    x: 14, y: 30}
]

class App extends React.Component {
  constructor() {
    super();
    this.data = DATA;

    this.canvas = new Canvas(this.data);
    this.progressBar = new ProgressBar()

    this.state = {started: false, finished: false, step: -1};

    // Add titles
    this.data.forEach((s) => {
      $('#titles').append(`<div class="title"><span class="caret">&raquo;</span>${s.title}</div>`)
    })

    // Add event handlers
    var beginButton = document.getElementById('begin-button');
    
    beginButton.addEventListener('click', () => {
      var splash = document.getElementById('splash');
      splash.style.display = 'none';
    })

    this.titles = document.getElementsByClassName('title');

    for (var i = this.data.length - 1; i >= 0; i--) {
      // Append divs with the event descriptions after the #main div
      $(`<div class="desc"><div class="box">${this.data[i].desc}</box></div>`).insertAfter('#main');

      // An IIFE that adds event listeners for hover to each of the event titles
      ((j) => {
        this.titles[j].addEventListener('mouseenter', (e) => {
          e.target.style['padding-left'] = '10px'
        })
        this.titles[j].addEventListener('mouseleave', (e) => {
          e.target.style['padding-left'] = '0'
        })
        this.titles[j].addEventListener('click', (e) => {
          this.setStep(j)
        })
      })(i)
    }

    $('#app').mouseup(() => {
      this.handleClick(1)
    })

    // Handle arrow keys as well as clicks.
    $(document).keydown((e) => {
      switch(e.which) {
        case 37: 
          this.handleClick(-1);
          break;

        case 39:
          this.handleClick(1);
          break;

        default: return;
      }
      e.preventDefault()
    })

    // Add instance variables referring to elements on the page that we'll want to
    // manipulate later.
    this.cover = document.getElementById('cover');
    this.descs = document.getElementsByClassName('desc');

  }

  componentDidMount() {
    this.canvas.build()
    this.progressBar.build(this.data.length + 1)
    this.canvas.advance(this.state.step)
    this.progressBar.fill(this.state.step)
  }
  
  handleClick(i) {
    this.setStep(this.state.step += i)
  }

  setStep(step) {
    // Perform cool flash animation
    this.cover.style.opacity = 0.5;
    setTimeout(() => {
      this.cover.style.opacity = 0.25;
    }, 250)
    this.setState({step: step, finished:false});
    this.canvas.advance(this.state.step);
    this.progressBar.fill(this.state.step);

    for (var i=0; i<this.data.length; i++) {
      this.titles[i].style.color = '#fff';
      this.descs[i].style.display = 'none';
    }
    this.titles[this.state.step].style.color = '#49709F';
    this.descs[this.state.step].style.display = 'initial';
    this.setState({started: true})
  }

  render() {
    return (
      <div>
      {!this.state.started ?
        <div>
          <div className="content" id="instructions" onClick={this.setStep.bind(this)}>
            Tap or click this photo to advance
          </div>
        </div>
        : null}
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
ReactDOM.render(<Stories/>, document.getElementById('related-content'))
