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

    // Add titles
    this.data.forEach((s) => {
      $('#titles').append(`<div class="title">${s.title}</div>`)
    })

    // Add event handlers
    var beginButton = document.getElementById('begin-button');
    
    beginButton.addEventListener('click', () => {
      var splash = document.getElementById('splash');
      splash.style.display = 'none';
    })

    this.titles = document.getElementsByClassName('title');

    for (var i = this.data.length - 1; i >= 0; i--) {
      // Append divs with the event descriptions after the #main div
      $(`<div class="desc">
          <div class="box">
            ${this.data[i].desc}
          </div>
        </div>`).insertAfter('#main');

      // An IIFE that adds event listeners for hover to each of the event titles
      ((j) => {
        this.titles[j].addEventListener('mouseenter', (e) => {
          e.target.style['padding-left'] = '10px'
        })
        this.titles[j].addEventListener('mouseleave', (e) => {
          e.target.style['padding-left'] = '0'
        })
        this.titles[j].addEventListener('click', (e) => {
          this.setStep(j)
        })
      })(i)
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
    if (step === this.data.length) {
      this.setState({step: step})
      this.setState({finished: true})
      this.cover.style.opacity = .7;
    }
    else if (step < this.data.length){
      this.setState({step: step})
      this.setState({started: true, finished: false})

      // Perform cool flash animation
      this.cover.style.opacity = 0.25;
      setTimeout(() => {
        this.cover.style.opacity = 0;
      }, 250)

      var entry = this.data[this.state.step];

      if (this.plotted.indexOf(this.id) === -1) {
        this.plotted.push(entry.id);
        this.svg.append('circle')
          .attr('class', 'point')
          .attr('id', 'point' + entry.id)
          .attr('cx', entry.x)
          .attr('cy', entry.y)
      }
      else {
        var c = document.getElementById('point' + entry.id);
        c.style.cx = entry.x + '%';
        c.style.cy = entry.y + '%';
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
