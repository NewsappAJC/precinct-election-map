import * as d3 from 'd3';

export default class {
  constructor(data) {
    this.data = data
    this.width = parseInt(d3.select('#canvas').style('width'));
  }

  build() {
    d3.select('window').on('resize', () => {
      this.width = parseInt(d3.select('#canvas').style('width'));
      console.log('resizing')
    })

    var svg = d3.select('div#canvas').append('svg')
        .attr('width', this.width) 
        .attr('height', '100%')
        .attr('position', 'absolute')

    this.points = svg.selectAll('circle')
      .data(this.data)
        .enter()
      .append('circle')
        .attr('class', 'point')
        .attr('r', '.4em')
        .attr('opacity', 0)
        .attr('cx', d => d.x + '%')
        .attr('cy', d => d.y + '%')

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
    this.points.attr('opacity', (d,i) => {
      return (step === i) ? 1 : 0;
    })
    this.descs.style('opacity', (d,i) => {
      return (step === i) ? 1 : 0;
    })
  }
}
