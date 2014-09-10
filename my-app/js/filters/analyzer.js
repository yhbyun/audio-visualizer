var util = require('util')
  , Filter = require('av/src/filter')
  , DrawSpectrum = require('../draw-spectrum')
  , winston = require('winston')
  , Arduino = require('../arduino');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level:'info' }),
    new (winston.transports.File)({ level:'debug', filename:'analyzer.log'})
  ]
});

var ARDUINO_FEATURE = false;

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

AnalyzerFilter.prototype.process = function(buffer, device) {
  if (this.status === 0) {
    this.status = 1; //playing
    this.drawSpectrum(device);
  }
};


AnalyzerFilter.prototype.drawSpectrum = function(device) {
  var self = this;

  var drawMeter = function() {
    var bytes, i, j;

    bytes = new Uint8Array(device.device.analyser.frequencyBinCount);
    device.device.analyser.getByteFrequencyData(bytes);

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

