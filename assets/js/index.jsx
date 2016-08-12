import { ProgressBar } from './progress-bar';
import { Canvas } from './canvas';

var App = React.createClass({
  constructor() {
    super();
    var data = [
      {title: 'cool', 
        desc: 'One of the aluminum wheels on the rover is damaged by a rock',
        x: 20, y: 50},
      {title: 'times',
        desc: 'The rover uses laser spectroscopy to analyze a piece of rock',
        x: 50, y: 40},
      {title: 'Bro',
        desc: 'The rover takes a selfie and sends it back to adoring fans on Earth', 
        x: 75, y: 20},
      {title: 'no way', 
        desc: 'The rover takes a cool picture of a Martian dune',
        x: 43, y: 80}
    ]
    this.state = { step: 0, started: false };
    this.canvas = new Canvas(data);
    this.faded = {opacity: .4, transition: 'opacity 1s'}
  }

  componentDidMount() {
    this.canvas.build()
    this.canvas.advance = (dir) => {
      this.setState({step: this.state.step += dir})
      this.canvas.points.attr('display', (d,i) => {
        return (this.state.step == i) ? null : 'none'
      })
      this.canvas.descs.style('display', (d,i) => {
        return (this.state.step == i) ? null : 'none'
      })
      this.canvas.descs.style('opacity', (d,i) => {
        return (this.state.step == i) ? 1 : 0
      })
    }
  }
  
  handleClick(i) {
    this.canvas.advance(i)
  }

  start() {
    this.setState({step: 1})
    this.canvas.advance(this.state.step)
    this.setState({started: !this.state.started})
  }

  render() {
    return (
      <div>
        <img className="backgroundImg" 
          style={this.state.started ? this.faded : null} src="http://cdn.phys.org/newman/gfx/news/hires/2015/18-nasascuriosi.jpg"/>
        { !this.state.started ? <button id="start" onClick={this.start.bind(this)}>Begin</button> : null}
        <div id="buttons">
          <button id="next" onClick={this.handleClick.bind(this, -1)}>Back</button>
          <button id="back" onClick={this.handleClick.bind(this, 1)}>Next</button>
        </div>
      </div>
    )
  }
})

ReactDOM.render(<App/>, document.getElementById('app'))