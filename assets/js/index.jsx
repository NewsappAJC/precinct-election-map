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
    title: 'Second step is really cool',
    x: 50, y: 40},
  {desc: 'Circles overlaid on a map/aerial photo show where each event took place', 
    title: 'Wow what a great third step',
    x: 75, y: 20},
  {desc: 'A progress bar at the top of the screen tracks how far the user has left to go',
    title: 'Fourth step deserves a medal',
    x: 43, y: 80},
  {desc: 'It can be hard to convey spatial logic with words. But with Stepr it\'s easy',
    title: 'Hi I\'m the fifth step',
    x: 15, y: 40},
  {desc: 'Try it out on mobile - it\'s responsive!',
    title: 'Sixth step reporting for duty',
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
      $('#titles').append(`<div class="title">${s.title}</div>`)
    })

    this.titles = document.getElementsByClassName('title');

    for (var i = 0; i < this.data.length; i++) {
      ((j) => {
        this.titles[j].addEventListener('mouseenter', (e) => {
          e.target.style['margin-left'] = '10px'
        })
        this.titles[j].addEventListener('mouseout', (e) => {
          e.target.style['margin-left'] = '0'
        })
        this.titles[j].addEventListener('click', (e) => {
          this.setStep(j)
        })
      })(i)
    }
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
    }
    this.titles[this.state.step].style.color = '#49709F';
  }

  start() {
    this.handleClick(1)
    this.setState({started: !this.state.started})

    $(document).mouseup(() => {
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

    $('#cover').style.opacity = .2;
  }

  render() {
    return (
      <div>

        {!this.state.started ? 
          <div>
            <div id="splash">
              <h1>Stepr</h1>
              <p>Tap or click to advance</p>
              <div id="start" onClick={this.start.bind(this)}>Begin</div> 
            </div>
          </div>
        : null}

        <h1 id="outro" style={!this.state.finished ? this.hidden : this.active}>
          Finished
        </h1>

      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
