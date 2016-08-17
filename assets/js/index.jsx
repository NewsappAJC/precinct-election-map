import ProgressBar from './progress-bar';
import Canvas from './canvas';
import React from 'react';
import ReactDOM from 'react-dom';
import '!style!css!sass!../css/style.scss';

const DATA = [
  {desc: 'This is Stepr. It\'s a responsive single-page app that displays a sequence of events',
    x: 20, y: 50},
  {desc: 'The user clicks, taps, or uses the arrow keys to step through the events',
    x: 50, y: 40},
  {desc: 'Circles overlaid on a map/aerial photo show where each event took place', 
    x: 75, y: 20},
  {desc: 'A progress bar at the top of the screen tracks how far the user has left to go',
    x: 43, y: 80},
  {desc: 'It can be hard to convey spatial logic with words. But with Stepr it\'s easy',
    x: 15, y: 40},
  {desc: 'Try it out on mobile - it\'s responsive!',
    x: 43, y: 80},
  {desc: 'Just make sure that the photo you upload has an aspect ratio of 5:7',
    x: 90, y: 20},
  {desc: 'That\'s it - nothing fancy here. Try it out in one of your stories!',
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


    $(document).keydown((e) => {
      if (this.state.started) {
        switch(e.which) {
          case 37: 
            this.handleClick(-1);
            console.log('left clicked')
            break;

          case 39:
            this.handleClick(1);
            console.log('right clicked')
            break;

          default: return;
        }
        e.preventDefault()
      }
    })
  }

  componentDidMount() {
    this.canvas.build()
    this.progressBar.build(this.data.length)
    this.canvas.advance(this.state.step)
    this.progressBar.fill(this.state.step)
  }
  
  handleClick(i) {
    switch(i) {
      case -1: 
        if (this.state.step > 0) {
          this.setState({step: this.state.step += i, finished:false});
          this.canvas.advance(this.state.step);
          this.progressBar.fill(this.state.step);
        }
        break;
      case 1:
        if (this.state.step < this.data.length - 1) {
          this.setState({step: this.state.step += i});
          this.canvas.advance(this.state.step);
          this.progressBar.fill(this.state.step);
        }
        else if (this.state.step == this.data.length - 1){
          this.setState({step: this.state.step += i});
          this.canvas.advance(this.state.step);
          this.setState({finished: true});
        }
        break;
    }
  }

  start() {
    this.handleClick(1)
    this.setState({started: !this.state.started})
    $(document).mouseup(() => {
      this.handleClick(1)
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
