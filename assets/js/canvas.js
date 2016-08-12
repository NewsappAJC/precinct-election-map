import * as d3 from 'd3';

export default class {
  constructor(data) {
    this.data = data
  }

  build() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
      width = parseInt(d3.select('#canvas').style('width')) - margin.left - margin.right,
      height = parseInt(d3.select('#canvas').style('height')) - margin.top - margin.bottom;

    var svg = d3.select('div#canvas')
      .append('svg')
        .attr('width', width + margin.left + margin.right) 
        .attr('height', height + margin.top + margin.bottom)
        .attr('position', 'absolute')
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    this.points = svg.selectAll('circle')
      .data(this.data)
        .enter()
      .append('circle')
        .attr('class', 'point')
        .attr('r', 10)
        .attr('cx', d => d.x + '%')
        .attr('cy', d => d.y + '%')
        .attr('r', 0)

    this.descs = d3.select('#canvas').selectAll('div')
      .data(this.data)
        .enter()
      .append('div')
        .html(d => '<div>' + d.desc + '</div>')
        .attr('class', 'desc')
        .style('transition', 'opacity 1s')
        .style('opacity', 0)
  }

 advance(step) {
    this.points.attr('r', (d,i) => {
      return (step === i) ? 10 : 0
    })
    this.descs.style('opacity', (d,i) => {
      return (step === i) ? 1 : 0
    })
  }
}
