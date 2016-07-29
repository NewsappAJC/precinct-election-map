class ProgressBar {

  constructor(data) {
    var margin = {top: 20, right: 20, bottom: 50, left: 70},
    width = 700 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

    var svg = d3.select('.progressBar')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

    var x = d3.scale.linear()
      .range([0, width])
      .domain([0, data.length])

    this.circles = svg.selectAll('circle')
      .data(data)
        .enter()
      .append('circle')
      .attr('cx', function(d, i) { return x(i)})
      .attr('r', 8)
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .on('click', function(d,i) {this.fill(i)}.bind(this))
      .on('mouseover', function(d, i) {
          d3.select(this).attr('stroke-width', '4px') 
          focus.transition()
            .duration(200)
            .style('display', null)
          tooltip(d, i)})
      .on('mouseout', function(d, i) {
          d3.select(this).attr('stroke-width', '1px') 
          focus.transition()
            .duration(200)
            .style('display', 'none')
      })

    var focus = svg.append('g')
      
    focus.append('text')
        .attr('class', 'y1')
        .style('stroke', 'white')
        .style('stroke-width', '3.5px')
        .attr('dx', 8)
        .attr('dy', '-.3em')

    focus.append('text')
        .attr('class', 'y2')
        .attr('dx', 8)
        .attr('dy', '-.3em')

    function tooltip(d, i) {
      focus.select('text.y1')
        .attr('transform', 'translate(' + x(i) + ',0)')
        .text(d.title)
      focus.select('text.y2')
        .attr('transform', 'translate(' + x(i) + ',0)')
        .text(d.title)
    }
  }

  fill() {}
}

class Canvas {
  constructor(data) {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
      width = parseInt(d3.select('#canvas').style('width')) - margin.left - margin.right,
      height = parseInt(d3.select('#canvas').style('height')) - margin.top - margin.bottom;

    var svg = d3.select('div#canvas')
      .append('svg')
        .attr('width', width + margin.left + margin.right) 
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    this.points = svg.selectAll('circle')
      .data(data)
        .enter()
      .append('circle')
        .attr('fill', 'black')
        .attr('r', 8)
        .attr('cx', d => d.x + '%')
        .attr('cy', d => d.y + '%')
        .attr('display', 'none')

    this.descs = d3.select('#main').selectAll('foreignObject')
      .data(data)
        .enter()
      .append('foreignObject')
      .append('xhtml:body')
        .style('width', '200px')
        .style('height', '10px')
        .html(d => '<span>' + d.desc + '</span>')
        .attr('class', 'desc')
        .style('left', d => d.x + '%')
        .style('top', d => d.y + '%')
        .style('display', 'none')
        .style('transition', 'opacity 1s')
        .style('opacity', 0)
  }

  step() {}
}

class App extends React.Component {
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
    this.state = { x: 0, started: false };
    this.handleClick = this.handleClick.bind(this);
    this.start = this.start.bind(this);
    this.progressBar = new ProgressBar(data);
    this.canvas = new Canvas(data);
    this.faded = {opacity: .4, transition: 'opacity 1s'}
  }

  componentDidMount() {
    this.progressBar.fill = (id) => {
      this.progressBar.circles.attr('fill', (d, i) => {
        return ((i <= id) ? 'black' : 'white') 
      })
    }
    this.canvas.step = () => {
      this.progressBar.fill(this.state.x)
      this.canvas.points.attr('display', (d,i) => {
        return (this.state.x == i) ? null : 'none'
      })
      this.canvas.descs.style('display', (d,i) => {
        return (this.state.x == i) ? null : 'none'
      })
      this.canvas.descs.style('opacity', (d,i) => {
        return (this.state.x == i) ? 1 : 0
      })
      this.setState({x: this.state.x += 1})
    }
    this.progressBar.fill(0)
  }
  
  handleClick() {
    this.canvas.step(this.state.x)
  }

  start() {
    this.setState({x: 1})
    this.canvas.step(this.state.x)
    this.setState({started: !this.state.started})
  }

  render() {
    return (
      <div>
        <img className="backgroundImg" 
          style={this.state.started ? this.faded : null} src="http://cdn.phys.org/newman/gfx/news/hires/2015/18-nasascuriosi.jpg"/>
        { !this.state.started ? <button id="start" onClick={this.start}>Begin</button> : null}
        <button id="next" onClick={this.handleClick}>Next</button>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
