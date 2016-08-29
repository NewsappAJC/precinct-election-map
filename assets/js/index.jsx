import Data from './data';
import ProgressBar from './progress-bar';
import Canvas from './canvas';
import Stories from './stories';
import React from 'react';
import ReactDOM from 'react-dom';
import '!style!css!sass!../css/vendor/foundation.min.css';
import '!style!css!sass!../css/style.scss';
import '../img/ajc-logo.png';
import '../img/title-card.png';

class App extends React.Component {
  constructor() {
    super();
    var Input = new Data;
    this.data = Input.data;

    this.Canvas = new Canvas();
    this.Canvas.build();
    this.svg = this.Canvas.svg;

    this.progressBar = new ProgressBar()

    this.state = {started: false, finished: false, step: -1};

    // Add event handlers
    var beginButton = document.getElementById('begin-button');
    
    beginButton.addEventListener('click', () => {
      var splash = document.getElementById('splash');
      splash.style.display = 'none';
    })

    for (var i = this.data.length - 1; i >= 0; i--) {
      // Append divs with the event descriptions after the #main div
      $(`<div class="desc">
          <div class="box">
            ${this.data[i].desc}
          </div>
        </div>`).insertAfter('#main');
    }

    // Add click event handler to canvas
    $('#app').mouseup(() => {
      this.handleClick(1)
    })

    // Handle arrow keys as well as clicks.
    $(document).keydown((e) => {
      switch(e.which) {
        case 37: 
          this.handleClick(-1);
          break;

        case 39:
          this.handleClick(1);
          break;

        default: return;
      }
      e.preventDefault()
    })

    // Add instance variables referring to elements on the page that I'll want to
    // reference later.
    this.cover = document.getElementById('cover');
    this.descs = document.getElementsByClassName('desc');

    this.progressBar.build(this.data.length + 1)
    this.progressBar.fill(this.state.step)
    this.plotted = [];
  }

  handleClick(i) {
    this.setStep(this.state.step + i)
  }

  setStep(step) {
    this.cover.style.opacity = 0;
    for (var i=0; i<this.data.length; i++) {
      this.descs[i].style.display = 'none';
    };

    var cs = document.getElementsByClassName('point');
    for (var i = 0; i < cs.length; i++) {
      cs[i].style.r = '5px';
    }

    if (step === this.data.length) {
      this.setState({step: step})
      this.setState({finished: true})
      this.cover.style.opacity = .7;
    }
    else if (step < this.data.length){
      this.setState({step: step, started: true, finished: false})
      this.descs[this.state.step].style.display = 'initial';
      var entry = this.data[this.state.step];
      var colors = ['blue', 'red'];

      if (this.plotted.indexOf(entry.id) === -1) {
        this.plotted.push(entry.id);
        this.svg.append('circle')
          .attr('class', 'point')
          .attr('fill', colors[entry.id])
          .attr('id', 'point' + entry.id)
          .attr('cx', entry.x + '%')
          .attr('cy', entry.y + '%')
          .attr('r', '7px');
      }
      else {
        var c = document.getElementById('point' + entry.id);
        c.style.cx = entry.x + '%';
        c.style.cy = entry.y + '%';
        c.style.r = '7px';
      }
    }
    else {
      return
    }

    this.progressBar.fill(this.state.step);
  }

  render() {
    return (
      <div>
      {!this.state.started ?
        <div>
          <div className="content" id="instructions" onClick={this.setStep.bind(this)}>
            Tap or click this photo to advance
          </div>
        </div>
        : null}
      {this.state.finished ?
        <div>
          <div className="content" id="finished">
            Finished. <a href="http://ajc.com" id="finished-link">Read more.</a>
          </div>
        </div>
        : null}
      </div>
    )
  }
}

ReactDOM.render(<App/>, document.getElementById('app'))
ReactDOM.render(<Stories/>, document.getElementById('related-content'))
