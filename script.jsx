class ProgressBar {

  constructor() {
    var margin = {top: 20, right: 20, bottom: 50, left: 70},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var svg = d3.select('body').append('svg')
        .attr('y', 400)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')');

    var data = ['cool','times','man','no','way','thats','awesome']

    var x = d3.scale.linear()
      .range([0, width])
      .domain([0, data.length])

    var line = svg.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', width)
      .attr('y2', 0)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)

    this.circles = svg.selectAll('circle')
      .data(data)
        .enter()
      .append('circle')
      .attr('cx', function(d, i) { return x(i)})
      .attr('r', 5)
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
        .text(d)
      focus.select('text.y2')
        .attr('transform', 'translate(' + x(i) + ',0)')
        .text(d)
    }
  }

  fill() {}
}

class App extends React.Component {
  constructor() {
    super();
    this.state = { x: 0 };
    this.handleClick = this.handleClick.bind(this);
    this.progressBar = new ProgressBar() 
  }

  componentDidMount() {
    this.progressBar.fill = (id) => {
      this.setState({x:id})
      this.progressBar.circles.attr('fill', (d, i) => {
        return ((i <= id) ? 'black' : 'white') 
      })
    }
    this.progressBar.fill(0)
  }
  
  handleClick() {
    this.setState({x: this.state.x += 1})
    this.progressBar.fill(this.state.x)
  }

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>Advance</button>
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
