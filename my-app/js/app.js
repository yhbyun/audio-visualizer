
var DrawSpectrum = require('./draw-spectrum')
  , Visualizer = require('./visualizer')
  , Analyser = require('./analyser_html5')
  , audioUtil = require('./audio-util');

window.addEventListener('load', function() {
  var audio = new Audio()
    , controls = document.getElementById('controls');

  audio.src = 'audio/test.ogg';
  //audio.src = 'audio/ACDC_-_Back_In_Black-sample.ogg';
  //audio.src = 'audio/Sample_of_-Another_Day_in_Paradise-.ogg';
  //audio.src = 'audio/16Hz-20kHz-Exp-CA-10sec.ogg';
  audio.preload = true;
  audio.controls = true;

  controls.appendChild(audio);

  audio.addEventListener('canplaythrough', function() {
    var processor = 0 ? new Analyser() : new Visualizer();
    processor.init();
    processor.start(audio);
  });
});


