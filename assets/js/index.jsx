import ProgressBar from './progress-bar';
import Canvas from './canvas';
import React from 'react';
import ReactDOM from 'react-dom';
import '!style!css!sass!../css/vendor/foundation.min.css';
import '!style!css!sass!../css/style.scss';
import '../img/ajc-logo.png';

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

    this.faded = {opacity: .4, transition: 'opacity 1s'};
    this.active = {opacity: 1, transition: 'opacity 1s'};
    this.hidden = {opacity: 0, transition: 'opacity 1s'};

    this.state = {started: false, finished: false, step: -1};

    // Add titles
    this.data.forEach((s) => {
      $('#titles').append(`<div class="title"><span class="caret">&raquo;</span>${s.title}</div>`)
    })

    this.titles = document.getElementsByClassName('title');

    // Add event handlers
    var beginButton = document.getElementById('begin-button');
    
    beginButton.addEventListener('click', () => {
      var splash = document.getElementById('splash');
      splash.style.display = 'none';
    })

    for (var i = this.data.length - 1; i >= 0; i--) {
      $(`<div class="desc"><div class="box">${this.data[i].desc}</box></div>`).insertAfter('#main');

      ((j) => {
        this.titles[j].addEventListener('mouseenter', (e) => {
          e.target.style['padding-left'] = '10px'
        })
        this.titles[j].addEventListener('mouseout', (e) => {
          e.target.style['padding-left'] = '0'
        })
        this.titles[j].addEventListener('click', (e) => {
          this.setStep(j)
        })
      })(i)
    }

    this.descs = document.getElementsByClassName('desc');

    $('#app').mouseup(() => {
      this.handleClick(1)
    })

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
    this.setState({step: step, finished:false});
    this.canvas.advance(this.state.step);
    this.progressBar.fill(this.state.step);

    for (var i=0; i<this.data.length; i++) {
      this.titles[i].style.color = '#fff';
      this.descs[i].style.display = 'none';
    }
    this.titles[this.state.step].style.color = '#49709F';
    this.descs[this.state.step].style.display = 'initial';
  }

  render() {
    return (
      <div></div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
