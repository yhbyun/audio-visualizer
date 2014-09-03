// audio utilities

function log10(val) {
  return Math.log(val) / Math.LN10;
}
exports.log10 = log10;

function linearToDecibels(linear) {
  // It's not possible to calculate decibels for a zero linear value since it would be -Inf.
  // -1000.0 dB represents a very tiny linear value in case we ever reach this case.
  if (!linear)
    return -1000;

  return 20 * log10(linear);
}
exports.linearToDecibels = linearToDecibels;

exports.getByteFrequencyData = function(fft, minDecibels, maxDecibels) {
  var specSize = fft.bufferSize * 0.5;
  var spectrum = fft.spectrum;
  var destination = new Uint8Array(specSize);
  var rangeScaleFactor = maxDecibels === minDecibels ? 1 : 1 / (maxDecibels - minDecibels);
  var linearValue, dbMag, scaledValue;

  for (var i = 0; i < specSize; ++i) {
    linearValue = spectrum[i];
    dbMag = !linearValue ? minDecibels : linearToDecibels(linearValue);

    // The range m_minDecibels to m_maxDecibels will be scaled to byte values from 0 to UCHAR_MAX.
    scaledValue = 255 * (dbMag - minDecibels) * rangeScaleFactor;

    // Clip to valid range.
    if (scaledValue < 0)
      scaledValue = 0;
    else if (scaledValue > 255)
      scaledValue = 255;

    destination[i] = scaledValue;

    /*
    if (i == 0) {
      logger.silly('linearValue=' + linearValue);
      logger.silly('scaledValue=' + scaledValue);
    }
    */
  }
  return destination;
};

