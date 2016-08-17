import ProgressBar from './progress-bar';
import Canvas from './canvas';
import React from 'react';
import ReactDOM from 'react-dom';
import '!style!css!sass!../css/style.scss';

class App extends React.Component {
  constructor() {
    super();
    this.data = [
      {desc: 'One of the aluminum wheels on the rover is damaged by a rock',
        x: 20, y: 50},
      {desc: 'The rover uses laser spectroscopy to analyze a piece of rock',
        x: 50, y: 40},
      {desc: 'The rover takes a selfie and sends it back to adoring fans on Earth', 
        x: 75, y: 20},
      {desc: 'The rover takes a cool picture of a Martian dune',
        x: 43, y: 80}
    ]
    this.state = { step: -1, started: false, finished: false };

    this.canvas = new Canvas(this.data);
    this.progressBar = new ProgressBar()

    this.faded = {opacity: .4, transition: 'opacity 1s'};
    this.active = {opacity: 1, transition: 'opacity 1s'};
    this.hidden = {opacity: 0, transition: 'opacity 1s'};


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
