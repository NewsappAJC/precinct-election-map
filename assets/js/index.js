import Data from './data';
import Stories from './stories';
import $ from 'jquery';
import * as _ from 'underscore';

class App {
  constructor() {
    this.started = false;
    this.finished = false;
    this.colors = ['#F78181', '#F2E241', '#2ECCFA'];
    this.step = -1; // Needs to start at -1 because it is used as an index after being incremented by one.
    var $map = $("#map"), $overlay = $("#overlay");
    this.mapDems = {width: $map.outerWidth(), height: $map.outerHeight()};

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
    // Check if the pin SVG is loaded before rendering pins. If not, wait .1 second and try again.
    var checkPin = (i) => {
      if ($('#firstPin').html() != undefined) {
        this.addPins();
      }
      else {
        setTimeout(checkPin.bind(i-1), 100)
      }
    }

    checkPin(30);
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
    $('#descPin').remove();

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

      // Append a pin to the desc so the user knows which pin is being described.
      var pin = $('#firstPin').clone();
      pin.removeAttr('id')

      var pinDiv = $('<div id="descPin"/>').html(pin);

      pinDiv.find('path')[0].setAttribute('fill', this.colors[entry.id]);
      var desc = $('.desc')[this.step]
      $(desc).prepend(pinDiv[0]);
    };

      // If necessary, display the finished message 
      this.getMessage();

      // Update the progress bar to show how much the user has progressed.
      // Add 1 so that the bar advances at step 0.
      this.progressBar.css({
        'width': `${ 100 * ((this.step + 1) / (this.data.length + 1)) }%`
      });

      this.setOpacity();
  };

  addPins() {
    this.data.forEach((entry) => {
      var pin = $('#firstPin').clone();
      pin.removeAttr('id');

      var pinDiv = $(`
          <div data-character=${entry.id} data-step=${entry.step} class="point" 
            style="left:${entry.x}%; top:${entry.y}%; opacity: 0"/>
      `).html(pin);
      
      // Set colors of the pin based on the character it represents.
      pinDiv.find('path')[0].setAttribute('fill', this.colors[entry.id]);

      $('#canvas').append(pinDiv);
    })
  }

  setOpacity() {
      // Select all pins on the page and hide any that
      var entry = this.data[this.step];
      var points = $('.point');
      points.each(function() {
        var character = $(this).data('character');
        if (entry.present.indexOf(character) === -1 || entry.id == character) {
          $(this).css({'opacity': 0});
        };
      });

      // thisId will hold a list of all pins that match 
      // the id of the current entry, which is linked to a given character.
      var thisId = [];

      points.each(function(i) {
        if (parseInt($(this).data('character')) === entry.id) {
          thisId.push(this);
        };
      })

      var sorted = _.sortBy(thisId, (point) => {
        return $(point).data('step');
      });

      for (var i = 0; i < sorted.length; i++) {
        if ($(sorted[i]).data('step') === entry.step) {
          var thisStep = i;
        };
      };

      // Set opacity of previous pin to .3, set opacity of current pin to 1
      if (sorted.slice(0,thisStep+1).length > 1) {
        sorted[thisStep - 1].style.opacity = .3;
      };

      sorted[thisStep].style.opacity = 1;
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

