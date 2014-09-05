
/*
createScriptProcessor로 생성된 processor가 fft 분석 및 스펙트럼 표시까지 하는 방법
*/

var winston = require('winston')
  , DrawSpectrum = require('./draw-spectrum')
  , audioUtil = require('./audio-util');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level:'info' }),
    new (winston.transports.File)({ level:'debug', filename:'analyser_html5.log'})
  ]
});

var defaultSmoothingTimeConstant = 0.8;
var defaultMinDecibels = -100;
var defaultMaxDecibels = -30;
var defaultFFTSize = 2048;

var frameBufferSize = 4096;
var bufferSize = frameBufferSize/4;

var signal = new Float32Array(bufferSize);

var fft = new FFT(bufferSize, 44100);
var prevSpectrum = new Float32Array(bufferSize/2);

var blackman = new WindowFunction(DSP.BLACKMAN);

var curAnalyser = null;

var Analyser = function () {
  this.audioContext = null,
  this.animationId = null;
  this.status = 0; //flag for sound is playing 1 or stopped 0
  this.drawer = new DrawSpectrum();
};

Analyser.prototype = {
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
      processor = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    curAnalyser = this;
    processor.onaudioprocess = this.process;
    source.connect(processor);
    processor.connect(this.audioContext.destination);

    this.status = 1;
  },
  process : function(event) {
    // Copy input arrays to output arrays to play sound
    var inputArrayL = event.inputBuffer.getChannelData(0);
    var inputArrayR = event.inputBuffer.getChannelData(1);
    var outputArrayL = event.outputBuffer.getChannelData(0);
    var outputArrayR = event.outputBuffer.getChannelData(1);

    var n = inputArrayL.length;
    for (var i = 0; i < n; ++i) {
      outputArrayL[i] = inputArrayL[i];
      outputArrayR[i] = inputArrayR[i];
      // create data frame for fft - deinterleave and mix down to mono
      signal[i] = (inputArrayL[i] + inputArrayR[i]) / 2;
    }

    blackman.process(signal);

    fft.forward(signal);

    // Blow away the packed nyquist component.
    fft.imag[0] = 0;

    // Normalize so than an input sine wave at 0dBfs registers as 0dBfs (undo FFT scaling factor).
    var magnitudeScale = 1.0 / defaultFFTSize;

    // A value of 0 does no averaging with the previous result.  Larger values produce slower, but smoother changes.
    var k = defaultSmoothingTimeConstant;
    k = Math.max(0.0, k);
    k = Math.min(1.0, k);

    // Convert the analysis data from complex to magnitude and average with the previous result.
    var specSize = fft.bufferSize * 0.5;
    var scalarMagnitude;
    var spectrum = fft.spectrum, real = fft.real, imag = fft.imag;
    var sqrt = Math.sqrt;
    for (i = 0; i < specSize; ++i) {
      scalarMagnitude = sqrt(real[i] * real[i] + imag[i] * imag[i]) * magnitudeScale;
      spectrum[i] = k * prevSpectrum[i] + ((1 - k) * scalarMagnitude);
      /*
      if (i === 0) {
        logger.silly('prev = ' + prevSpectrum[i]);
        logger.silly('curr = ' + spectrum[i]);
      }
      */
      prevSpectrum[i] = spectrum[i];
    }

    var bytes = audioUtil.getByteFrequencyData(fft, defaultMinDecibels, defaultMaxDecibels);
    curAnalyser.drawer.draw(bytes);
  }
}

module.exports = Analyser;
