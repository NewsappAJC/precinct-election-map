import * as d3 from 'd3';

export default class {

  constructor() {
    this.progressWidth = 0;
  }

  build(len) {
    this.totalWidth = parseInt(d3.select('#progressBar').style('width'));
    var height = parseInt(d3.select('#progressBar').style('height'));

    var svg = d3.select('#progressBar').append('svg')
        .attr('width', this.totalWidth)
        .attr('height', height)

    this.x = d3.scaleLinear()
      .range([0, this.totalWidth])
      .domain([0, len])

    this.bar = svg.append('rect')
      .attr('width', this.progressWidth)
      .attr('height', height)
      .attr('fill', 'white')
      .style('transition', 'width .5s')
  }
    
  fill(step) {
    this.bar.attr('width', this.x(step + 1))
  }
}
