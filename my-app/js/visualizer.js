
/*
HTML5의 AnalyzerNode가 fft는 담당하고 스펙트럼 표시만 처리하는 방법
*/

var DrawSpectrum = require('./draw-spectrum');

var Visualizer = function() {
  this.file = null, //the current file
  this.fileName = null, //the current file name
  this.audioContext = null,
  this.source = null, //the audio source
  this.animationId = null,
  this.status = 0, //flag for sound is playing 1 or stopped 0
  this.forceStop = false,
  this.drawer = new DrawSpectrum();
}

Visualizer.prototype = {
  init: function() {
    this.prepareAPI();
  },
  prepareAPI: function() {
    //fix browser vender for AudioContext and requestAnimationFrame
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      this._updateInfo('!Your browser does not support AudioContext', false);
      console.log(e);
    }
  },
  start: function(audio) {
    var source = this.audioContext.createMediaElementSource(audio),
      analyser = this.audioContext.createAnalyser();

    source.connect(analyser);
    analyser.connect(this.audioContext.destination);

    this.status = 1;
    this.drawSpectrum(analyser);
  },
  drawSpectrum: function(analyser) {
    var self = this, drawer = new DrawSpectrum();

    var drawMeter = function() {
      var freqByteData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqByteData);
      drawer.draw(freqByteData);
      self.animationId = requestAnimationFrame(drawMeter);
    }
    this.animationId = requestAnimationFrame(drawMeter);
  }
};

module.exports = Visualizer;
