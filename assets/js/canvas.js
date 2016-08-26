import * as d3 from 'd3';

export default class {
  constructor() {
    this.width = parseInt(d3.select('#canvas').style('width'));
  }

  build() {
    d3.select('window').on('resize', () => {
      this.width = parseInt(d3.select('#canvas').style('width'));
      console.log('resizing')
    })

    this.svg = d3.select('div#canvas').append('svg')
        .attr('width', this.width) 
        .attr('height', '100%')
        .attr('position', 'absolute')
  }
}
