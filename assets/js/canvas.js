class Canvas {
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
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    this.points = svg.selectAll('circle')
      .data(this.data)
        .enter()
      .append('circle')
        .attr('fill', 'black')
        .attr('r', 8)
        .attr('cx', d => d.x + '%')
        .attr('cy', d => d.y + '%')
        .attr('display', 'none')

    this.descs = d3.select('#canvas').selectAll('foreignObject')
      .data(this.data)
        .enter()
      .append('foreignObject')
      .append('html:div')
        .html(d => '<div>' + d.desc + '</div>')
        .attr('class', 'desc')
        .style('left', d => d.x + '%')
        .style('top', d => d.y + '%')
        .style('display', 'none')
        .style('transition', 'opacity 1s')
        .style('opacity', 0)
  }

  advance() {}
}
