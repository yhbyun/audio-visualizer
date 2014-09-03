// Draw audio spectrum using canvas

var DrawSpectrum = (function() {
  var canvas = document.getElementById('canvas'),
    cwidth = canvas.width,
    cheight = canvas.height - 2,
    meterWidth = 10, //width of the meters in the spectrum
    gap = 2, //gap between meters
    capHeight = 2,
    capStyle = '#fff',
    meterNum = 800 / (10 + 2), //count of the meters
    capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame

  function DrawSpectrum() {
    ctx = canvas.getContext('2d'),
    gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(1, '#0f0');
    gradient.addColorStop(0.5, '#ff0');
    gradient.addColorStop(0, '#f00');
  }

  DrawSpectrum.prototype.draw = function(bytes) {
    var array = bytes;

    /*
    if (that.status === 0) {
      //fix when some sounds end the value still not back to zero
      for (var i = array.length - 1; i >= 0; i--) {
        array[i] = 0;
      };
      allCapsReachBottom = true;
      for (var i = capYPositionArray.length - 1; i >= 0; i--) {
        allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
      };
      if (allCapsReachBottom) {
        cancelAnimationFrame(that.animationId); //since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
        return;
      };
    };
    */
    var step = Math.round(array.length / 2 / meterNum); //sample limited data from the total array
    ctx.clearRect(0, 0, cwidth, cheight);
    for (var i = 0; i < meterNum; i++) {
      var value = array[i * step];
      if (capYPositionArray.length < Math.round(meterNum)) {
        capYPositionArray.push(value);
      };
      ctx.fillStyle = capStyle;
      //draw the cap, with transition effect
      if (value < capYPositionArray[i]) {
        ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
      } else {
        ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
        capYPositionArray[i] = value;
      };
      ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
      ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
    }
  };

  return DrawSpectrum;
}());


module.exports = DrawSpectrum;
