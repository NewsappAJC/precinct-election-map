//import ProgressBar from './progress-bar';
import Canvas from './canvas';
import React from 'react';
import ReactDOM from 'react-dom';
import '../css/style.css';

class App extends React.Component {
  constructor() {
    super();
    var data = [
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
    this.canvas = new Canvas(data);
    this.faded = {opacity: .4, transition: 'opacity 1s'}
    this.active = {opacity: 1, transition: 'opacity 1s'}
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
          style={this.state.started ? this.active : this.faded } src="http://cdn.phys.org/newman/gfx/news/hires/2015/18-nasascuriosi.jpg"/>
        { !this.state.started ? <button id="start" onClick={this.start.bind(this)}>Begin</button> : null}
        <div id="buttons">
          <button id="next" onClick={this.handleClick.bind(this, -1)}>Back</button>
          <button id="back" onClick={this.handleClick.bind(this, 1)}>Next</button>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
