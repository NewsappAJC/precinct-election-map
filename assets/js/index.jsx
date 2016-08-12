//import ProgressBar from './progress-bar';
import Canvas from './canvas';
import React from 'react';
import ReactDOM from 'react-dom';
import '../css/style.css';

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
    this.state = { step: -1, started: false };
    this.canvas = new Canvas(this.data);
    this.faded = {opacity: .4, transition: 'opacity 1s'};
    this.active = {opacity: 1, transition: 'opacity 1s'};
    this.hidden = {display: 'none'};
  }

  componentDidMount() {
    this.canvas.build()
    this.canvas.advance(this.state.step)
  }
  
  handleClick(i) {
    this.setState({step: this.state.step += i})
    this.canvas.advance(this.state.step)
  }

  start() {
    this.handleClick(1)
    this.setState({started: !this.state.started})
  }

  render() {
    return (
      <div>
        <img className="backgroundImg" 
          style={this.state.started ? this.active : this.faded } src="./img/middle_earth_cropped.jpg"/>

        {!this.state.started ? 
        <div>
          <button id="start" onClick={this.start.bind(this)}>Begin</button> 
          <div id="splash">
            <h1>Title Goes Here</h1>
            <p>Brief explanatory text goes right here. Keep it under 100 characters.</p>
          </div>
        </div>
        : null}

        <div id="buttons" style={this.state.started ? null : this.hidden}>
          <button id="Back" 
            disabled={this.state.step <= 0}
            onClick={this.handleClick.bind(this, -1)}>Back</button>
          <button id="Next" 
            disabled={this.state.step >= this.data.length}
            onClick={this.handleClick.bind(this, 1)}>
              {(this.state.step < this.data.length - 1) ? 'Next' : 'Finish'} 
            </button>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
