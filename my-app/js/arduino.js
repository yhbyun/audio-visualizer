var five = require('johnny-five');

module.exports = Arduino;

function Arduino() {
  var self = this;
  this.led = [];
  this.board = new five.Board();
  this.board.on("ready", function() {
    var i, j, len;
    var pwm = [3, 5, 6, 9, 10, 11];

    for (i = 0; i < 6; i++) {
      self.led[i] = new five.Led({
        pin: pwm[i]
      });
    }

    len = self.led.length;
    for (i = 0; i < len; i++) {
      self.led[i].on();
    }
  });
}

Arduino.prototype.brightness = function(no, val) {
  this.led[no].brightness(val);
};


