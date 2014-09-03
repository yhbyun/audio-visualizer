// version that uses speaker event
// - because of the irregular event fires, spectrum isn't displayed continuously.

var ipc     = require('ipc')
  , fs      = require('fs')
  , lame    = require('lame')
  , Speaker = require('speaker')
  , util    = require('util')
  , events  = require('events')
  , _       = require('underscore')
  , analyzer = new require('stream').Transform()
  , winston = require('winston')
  , DrawSpectrum = require('./draw-spectrum')
  , audioUtil = require('./audio-util');


var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level:'info' }),
    new (winston.transports.File)({ level:'debug', filename:'play.log'})
  ]
});

module.exports = Player;

function errHandler(err) {
  if (err) throw err;
  return false;
}

var defaults = {
};

var frameBufferSize = 4096;
var bufferSize = frameBufferSize/4;

var signal = new Float32Array(bufferSize);

var fft = new FFT(bufferSize, 44100);

analyzer._transform = function(x, encoding, cb) {
  var left, right;

  //x.legnth : 73728, 애를 1024 * 4 = 4096 으로 바꿀 수 있는 방법은?
  //var sample = x.length / (1024 * 4);
  var sample = 1;
  var channel = 2;
  var n = x.length / (2 * sample * channel);

  //console.log('x.length=' + x.length + ', n=' + n);

  for (var i = 0; i < n; ++i) {
    left = (x.readInt16LE(i * 2 * sample * channel) / 0x7fff);
    if (channel === 2) {
      right = (x.readInt16LE(i * 2 * sample * channel + 2) / 0x7fff);
    } else {
      right = left;
    }
    signal[i] = (left + right) / 2;    // create data frame for fft - deinterleave and mix down to mono
  }

  //console.log('x.length=' + x.length + ', n=' + n + ', first=' + signal[0]);

  fft.forward(signal);
  fft.calculateSpectrum();

  this.push(x);
  cb();
};


function Player(song, params) {
  if (!song) return false;
  this.song = song;
  this.options = _.extend(defaults, params);
  this.bindEvents();
  events.EventEmitter.call(this);
  this.drawer = new DrawSpectrum();
};

util.inherits(Player, events.EventEmitter);

Player.prototype.play = function(done) {
  var self = this;

  if (! done) this.on('done', _.isFunction(done) ? done : errHandler);
  if (! this.song) return false;

  play(this.song, function(err) {
    self.emit('done', err);
  }); 

  function play(song, callback) {
    fs.createReadStream(song, {
        highWaterMark: 200
      })
      .pipe(new lame.Decoder())
      .on('format', function(format) {
        var speaker = new Speaker(format);
        self.speaker = {};
        self.speaker.readableStream = this;
        self.speaker.Speaker = speaker;
        self.emit('playing', song);
        speaker.on('written', function(b) {
          self.analyze(b);
        });
        // this is where the song acturaly played end,
        // can't trigger playend event here cause
        // unpipe will fire this speaker's close event.
        this.pipe(speaker).on('close', function() {
          self.emit('stopped', song);
        });
      })
      .on('finish', function() {
        self.emit('playend', song);
        // switch to next one
        callback(null);
      });
  }
}

/**
 *
 * Stop playing and unpipe stream.
 * No params for now.
 *
 **/
Player.prototype.stop = function() {
  if (!this.speaker) return false;
  this.speaker.readableStream.unpipe();
  this.speaker.Speaker.end();
  return false;
}

Player.prototype.getID3 = function(callback) {
  if (! this.song) return false;

  var self = this;
  var file = fs.createReadStream(this.song);
  var decoder = new lame.Decoder();
  decoder.on('id3v1', function (id3) {
    callback(id3);
  });
  decoder.on('id3v2', function (id3) {
    callback(id3);
  });
  file.pipe(decoder);
}

/**
 *
 * Bind some useful events
 * @events.playing: on playing, keeping play history up to date.
 *
 **/
Player.prototype.bindEvents = function() {
  var self = this;
  this.on('playing', function(song) {
    self.playing = song;
  });
};


Player.prototype.analyze = function(x) {
  var left, right;

  //x.legnth : 73728, 애를 1024 * 4 = 4096 으로 바꿀 수 있는 방법은?
  //var sample = x.length / (1024 * 4);
  var sample = 1;
  var channel = 2;
  var n = x.length / (2 * sample * channel);

  logger.debug('x.length=' + x.length + ', n=' + n);

  for (var i = 0; i < n; ++i) {
    left = (x.readInt16LE(i * 2 * sample * channel) / 0x7fff);
    if (channel === 2) {
      right = (x.readInt16LE(i * 2 * sample * channel + 2) / 0x7fff);
    } else {
      right = left;
    }
    signal[i] = (left + right) / 2;    // create data frame for fft - deinterleave and mix down to mono
  }

  //console.log('x.length=' + x.length + ', n=' + n + ', first=' + signal[0]);

  fft.forward(signal);
  fft.calculateSpectrum();

  var specSize = fft.bufferSize * 0.5;
  for (i = 0; i < specSize; ++i) {
    fft.spectrum[i] = fft.spectrum[i] * 2000;
  }

  this.drawer.draw(fft.spectrum);
};

