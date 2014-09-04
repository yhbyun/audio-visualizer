var util = require('util')
  , Filter = require('av/src/filter')
  , DrawSpectrum = require('../draw-spectrum')
  , audioUtil = require('../audio-util')
  , winston = require('winston')
  , Arduino = require('../arduino');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level:'info' }),
    new (winston.transports.File)({ level:'debug', filename:'analyzer.log'})
  ]
});

var FFT_FILTER_FEATURE = true;
var ARDUINO_FEATURE = true;

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

function AnalyzerFilter() {
  Filter.call(this);
  this.animationId = null;
  this.status = 0; //flag for sound is playing 1 or stopped 0
  this.drawer = new DrawSpectrum();
  if (ARDUINO_FEATURE) {
    this.arduino = new Arduino();
  }
};

util.inherits(AnalyzerFilter, Filter);

AnalyzerFilter.prototype.process = function(buffer) {
  var i, specSize;

  // deinterleave and mix down to mono
  signal = DSP.getChannel(DSP.MIX, buffer);

  //logger.silly('buffer length=' + buffer.length);
  //logger.silly('signal length=' + signal.length);

  if (FFT_FILTER_FEATURE) {
    blackman.process(signal);

    // perform forward transform
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
    specSize = fft.bufferSize * 0.5;
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
  } else {
    fft.forward(signal);
    fft.calculateSpectrum();

    specSize = fft.bufferSize * 0.5;
    for (i = 0; i < specSize; ++i) {
      fft.spectrum[i] = fft.spectrum[i] * 2000;
    }
  }

  if (this.status === 0) {
    this.status = 1; //playing
    this.drawSpectrum();
  }
};

AnalyzerFilter.prototype.drawSpectrum = function() {
  var self = this;

  var drawMeter = function() {
    var bytes, i, j;

    if (FFT_FILTER_FEATURE) {
        bytes = audioUtil.getByteFrequencyData(fft, defaultMinDecibels, defaultMaxDecibels);
    } else {
        bytes = fft.spectrum;
    }

    self.drawer.draw(bytes);
    if (ARDUINO_FEATURE) {
      // 512 bytes
      for (i = 0, j = 0; i < 6; i++, j = j + 70) {
        self.arduino.brightness(i, bytes[j]);
      }
    }
    self.animationId = requestAnimationFrame(drawMeter);
  }
  this.animationId = requestAnimationFrame(drawMeter);
};


module.exports = AnalyzerFilter;

