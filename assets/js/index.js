import Data from './data';
import ProgressBar from './progress-bar';
import Canvas from './canvas';
//import Stories from './stories';
import '!style!css!sass!../css/vendor/foundation.min.css';
import '!style!css!sass!../css/style.scss';
import '../img/ajc-logo.png';
import '../img/bak.jpg';
import '../img/green-pin.svg';
import '../img/blue-pin.svg';
import '../img/orange-pin.svg';
import '../img/title-card.jpg';
import '../index.html';
import * as d3 from 'd3';

class App {
  constructor() {
    this.started = false;
    this.finished = false;
    this.step = -1; // Needs to start at -1 because it is used as an index after being incremented by one.

    // Get the data containing a list of steps.
    var Input = new Data;
    this.data = Input.data;

    // Create a new canvas object, which is where the pins 
    // will be drawn.
    this.canvas = d3.select('div#canvas');

    // Display a bar across the top of the screen that gradually
    // fills in as the user navigates through the app.
    this.progressBar = new ProgressBar();
    this.progressBar.build(this.data.length + 1)
    this.progressBar.fill(this.step)

    // Add an event handler to the splash screen's "Begin" button
    // that hides the splash screen.
    var beginButton = document.getElementById('begin-button');
    
    beginButton.addEventListener('click', () => {
      var splash = document.getElementById('splash');
      splash.style.display = 'none';
    })

    var backButton = document.getElementById('back-button');
    backButton.addEventListener('click', () => {
      this.handleClick(-1);
    });

    var nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', () => {
      this.handleClick(1);
    });

    for (var i = 0; i < this.data.length; i++) {
      // Append divs with descriptions of each step.
      $('#descs').append(`<div class="desc">
          <div class="box">
            ${this.data[i].desc}
          </div>
        </div>`);
    }

    $('#wrapper').on('mouseup', () => {
      this.handleClick(1) // Handle click takes an argument that determines whether to step forward or backward
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

    // Change the opacity of the cover div to display text on top 
    // of the picture
    this.cover = document.getElementById('cover');

    // These descriptions will be displayed below or to the left of the picture
    this.descs = document.getElementsByClassName('desc');

    // Last of all, display the instructions
    this.getMessage();
  }

  /*
   * Check whether the user is moving forward or backward, and display the 
   * correct descriptions and pins accordingly.
   */
  handleClick(i) {
    this.setStep(this.step + i)
  }

  /* 
   * Change the opacity of different pins depending on which step is
   * currently displayed, and if necessary display the "finished" message
   * or the instructions
  */
  setStep(step) {
    this.cover.style.opacity = 0;

    if (step <= -1) {
      return;
    };

    // Hide all the descriptions. The description that corresponds to the 
    // step will be displayed later
    for (var i=0; i<this.data.length; i++) {
      this.descs[i].style.display = 'none';
    };

    // Check if the user has finished the last step in the visualization.
    // If so, display a finished message
    if (step >= this.data.length) {
      this.step = this.data.length;
      this.finished = true;
      this.cover.style.opacity = .7;
    }
    else if (step < this.data.length){
      var entry = this.data[step];

      this.step = step;
      this.started = true;
      this.finished = false;

      this.descs[this.step].style.display = 'initial';

      var colors = ['green', 'blue', 'orange']

      this.canvas.append('img')
        .attr('src', '../img/' + colors[entry.id] + '-pin.svg')
        // Each pointer's class contains a number that links it
        // to one of the characters in the visualization.
        .attr('class', 'point ' + entry.id) 
        .style('left', entry.x + '%')
        .style('top', entry.y + '%')

      var points = document.getElementsByClassName('point');

      // thisId will hold a list of all the pointer elements that match 
      // the id of the current entry.
      var thisId = [];

      for (var i = 0; i < points.length; i++) {
        // Use regex to get the id number from the pointer's class name, and coerce
        // it from a string to a number.
        var id = points[i].getAttribute('class').match(/\d/)[0];
        var num = parseInt(id);
        // If a particular pointer is not relevant at this step, it will not be 
        // in the entry's present[] array. Change its opacity to zero.
        if (entry.present.indexOf(num) === -1) {
          points[i].style.opacity = 0;
        }
        // Create a list of all the pins that correspond to this entry's id.
        if (entry.id === num) {
          thisId.push(points[i])
        }
      }

      // Loop through the pins corresponding to this entry's id. Set the opacity
      // of the newest pin to 1. Set the opacity of the previous pin to .3, so that
      // it is still faintly visible. Set the opacity of earlier pins to 0.
      if (thisId.length > 1) {
        thisId.forEach((elem, i) => {
          if (i === thisId.length - 2) {
            thisId[i].style.opacity = .3;
          }
          else {
            thisId[i].style.opacity = 0;
          }
        })
      }
      thisId[thisId.length-1].style.opacity = 1;
    }

    else {
      return
    }

    // Display the started or finished message as needed.
    this.getMessage();

    // Update the progress bar to show how much the user has progressed.
    this.progressBar.fill(this.step);
  }

  /* 
   * Check whether started is set to false, or if finished is set to true.
   * Display either the finished message or the instructions if necessary.
  */
  getMessage() {
    // Remove the existing message by emptying the message div.
    $('#message').empty();

    // If the user hasn't started yet, show them instructions.
    if (!this.started) {
      var msg = `<div 
        id="instructions">
            Tap or click this photo to advance
        </div>`
      $('#message').append(msg);
    }
    // If the user has finished, display the finished text.
    else if (this.finished) {
      var msg = `<div 
        id="finished">
            Finished. <a href="http://investigations.blog.ajc.com/2016/07/11/atlanta-police-fire-officer-involved-deadly-shooting-video-of-incident-not-yet-released/" id="finished-link"><br>Read more.</a>
        </div>`
      $('#message').append(msg);
    }
  }
}

// Initialize the app
var ShootingApp = new App();

