import Data from './data';
import Stories from './stories';
import $ from 'jquery';

class App {
  constructor() {
    this.started = false;
    this.finished = false;
    this.step = -1; // Needs to start at -1 because it is used as an index after being incremented by one.
    var $map = $("#map"), $overlay = $("#overlay");
    this.mapDems = {width: $map.outerWidth(), height: $map.outerHeight()};

    // Set the image cover to the size of the map image
    $("#wrapper").css("max-width", this.mapDems.width);
    $overlay.css("width", this.mapDems.width);
    $overlay.css("height", this.mapDems.height);
    $("#cover").css("height", this.mapDems.height);


    // Get the data containing a list of steps.
    var Input = new Data;
    this.data = Input.data;

    // Select the canvas object where the pins 
    // will be drawn.
    this.canvas = $('#canvas');

    // Hide the back button until the user navigates to the next step.
    $('#back-button').hide();

    // Display a bar across the top of the screen that gradually
    // fills in as the user navigates through the app.
    this.progressBar = $('#progress-bar');

    // Render a list of related stories.
    var stories = new Stories();
    stories.render();

    // Add an event handler to the splash screen's "Begin" button
    // that hides the splash screen.
    $('#begin-button').click(() => {
      $('#splash').hide();
    })

    // Add event handlers to the back and next buttons, and the photo
    $('#back-button').mouseup(() => {
      this.handleClick(-1);
    })
    $('#next-button').mouseup(() => {
      this.handleClick(1);
    })
    $('#app').mouseup(() => {
      this.handleClick(1)
    })

    // Append divs with descriptions of each step.
    for (var i in this.data) {
      $('#descs').append(`
        <div class="desc">
          <div class="box">
            ${this.data[i].desc}
          </div>
        </div>
      `);
    }

    // Get the pin SVG and add it (while hidden) to the canvas.
    // We'll make copies of it later to render the other pins.
    $.get('./img/pin.svg', (el) => {
      var pin = el.firstChild;
      pin.setAttribute('id', 'firstPin');
      document.body.appendChild(pin);
    })

    // Create an instance variable referring to these descriptions.
    this.descs = $('.desc');

    // Last of all, display the instructions.
    this.getMessage();
  }


  /*
   * Check whether the user is moving forward or backward, and display the 
   * correct descriptions and pins accordingly. 
  */
  handleClick(i) {
    var step;
    if (this.step === this.data.length && i > 0) {
      step = this.data.length;
    }
    else {
      step = this.step + i
    };

    this.setStep(step);
  }


  /* 
   * Hide or change the opacity of pins depending on which step is
   * currently displayed. If necessary display the "finished" message
   * or the instructions.
  */
  setStep(step) {
    // Hide the cover div.
    $('#cover').css({'opacity': 0});

    // Hide all the descriptions. The description that corresponds to this
    // step will be displayed later.
    this.descs.hide();

    // Check if the user has finished the last step in the visualization.
    // If so, display a finished message, and prevent the step from incrementing.
    if (step === this.data.length) {
      this.step = this.data.length;
      this.finished = true;
      $('#cover').css({'opacity': .7});
      $('#next-button').hide();
    }

    else if (step < this.data.length){
      this.step = step;

      // Only display back button if the user is past the first step.
      var backDisplay = step <= 0 ? 'none' : 'initial';
      $('#back-button').css({'display': backDisplay});
      $('#next-button').show();

      // Assign the correct item in the data object to the entry variable.
      var entry = this.data[step];

      this.started = true;
      this.finished = false;

      // Unhide the relevant div
      this.descs[step].style.display = 'initial';

    };

      // If necessary, display the finished message 
      this.getMessage();

      // Update the progress bar to show how much the user has progressed.
      // Add 1 so that the bar advances at step 0.
      this.progressBar.css({
        'width': `${ 100 * ((this.step + 1) / (this.data.length + 1)) }%`
      });

      // Check if the pin SVG is loaded. If not, wait .1 second and try again.
      var checkPin = (i) => {
        if ($('#firstPin') != undefined) {
          this.addPin();
        }
        else {
          setTimeout(checkPin.bind(i-1), 100)
        }
      }

      checkPin(30);
  };

  addPin(file) {
      // Append a pin for this step.
      var pin = $('#firstPin').clone();
      pin.removeAttr('id');
      if (!this.data[this.step]) {
        return;
      }
      var entry = this.data[this.step];

      var pinDiv = $(`
          <div class="point character${entry.id}" 
            style="left:${entry.x}%; top:${entry.y}%"/>
      `).html(pin);
      
      // Set colors of the pin based on the character it represents.
      var colors = ['#F78181', '#F2E241', '#2ECCFA'];
      pinDiv.find('path')[0].setAttribute('fill', colors[entry.id]);

      $('#canvas').append(pinDiv);

      // Select all pins on the page
      var points = $('.point');

      // thisId will hold a list of all pins that match 
      // the id of the current entry, which is linked to a given character.
      var thisId = [];

      for (var i = 0; i < points.length; i++) {
        // Use regex to get the id number from the pointer's class name, and coerce
        // it from a string to a number.
        var id = points[i].getAttribute('class').match(/\d/)[0];
        var num = parseInt(id);
        // If a particular pointer is not relevant at this step, it will not be 
        // in the entry variable's present[] array. If so, change its opacity to zero.
        if (entry.present.indexOf(num) === -1) {
          points[i].style.opacity = 0;
        }
        // Create a list of all the pins that correspond to this character.
        if (entry.id === num) {
          thisId.push(points[i])
        }
      }

      // Loop through this character's pins. Set the opacity
      // of the previous pin to .3. Hide earlier pins
      // by setting their opacity to 0.
      if (thisId.length > 1) {
        for (var i = 0; i < thisId.length; i++) {
          if (i === thisId.length - 2) {
            thisId[i].style.opacity = .3;
          }
          else {
            thisId[i].style.opacity = 0;
          }
        };
      };

      thisId[thisId.length-1].style.opacity = 1;
    };


  /* 
   * Check whether started is set to false, or if finished is set to true.
   * Display either the finished message or the instructions if necessary.
  */
  getMessage() {
    // Remove the existing message by emptying the message div.
    $('#instructions').empty();
    $('#finished').empty();
    $('#finished').hide();

    // If the user hasn't started yet, show them instructions.
    if (!this.started) {
      var msg = `<div>
            Tap or click this photo to advance.
        </div>`
      $('#instructions').append(msg);
    }
    // If the user has finished, display the finished text.
    else if (this.finished) {
      var msg = `<a class="finished-link" 
          href="http://www.ajc.com/news/news/breaking-news/former-atlanta-cop-indicted-for-murder/nsPpj/">
          Read more
        </a>`
      $('#finished').append(msg);
      $('#finished').show();
    }
  }
}

// Initialize the app
var ShootingApp = new App();

