// Function that adds trailing zeros to numbers with less than 2 digits after the decimal. eg. 2 ==> 2.00, 5.1 ==> 5.10
function addTrailingZeros(num, digits) {
  var number = Number(num);
  var zeroes = digits - decimalPlaces(number);
  if (!('' + number).includes('.')) {
    number = number + '.';
  }
  for (var j = 0; j < zeroes; j++) {
    number = number + "0";
  }
  return number;
}

function roundNthDigUp(num, nth) {
  num = num * nth;
  num = Math.ceil(num);
  num = num / nth;
  return num;
}

function fixPrecision(num) {
  num = num * 1000000;
  num = Math.round(num);
  num = num / 1000000;
  return num;
}

// Function returns the number of digits after the decimal place
function decimalPlaces(num) {
  var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
    0,
    // Number of digits right of decimal point.
    (match[1] ? match[1].length : 0)
    // Adjust for scientific notation.
    - (match[2] ? +match[2] : 0));
}

module.exports = { decimalPlaces, fixPrecision, roundNthDigUp, addTrailingZeros };