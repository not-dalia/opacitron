/**
 * Author: @not-dalia
 * License: MIT
 * Date: 2023-03-05
 */


/**
 * @param {number[]|string} color Array of RGB values or HEX string
 * @param {number} alpha Alpha value (0-1)
 */
function Color (color, alpha) {
  if (!alpha) alpha = 1;
  if (!color) throw new Error('Invalid color');
  if (Array.isArray(color)) {
    this.color = color;
  } else if (color.length == 7) {
    this.color = ColorUtils.hexToRgb(color);
  } else throw new Error('Invalid color');
  this.color = this.color.map(function (value) { return Math.max(0, value) });
  this.alpha = alpha;
}

/**
 * @returns {number[]} Array of RGB values
 */
Color.prototype.getColor = function () {
  return this.color;
}

Color.prototype.getNormalisedRGB = function () {
  return this.color.map(function (value) { return value / 255 });
}

/**
 * @param {number} precision Number of decimal places to round to
 * @returns {string} RGB string
 */
Color.prototype.getRGBString = function (precision) {
  if (!precision) precision = 0;
  return ColorUtils.getRGBString(this, this.alpha, precision);
}

/**
 * @param {'css'|'xaml'} style 'css' or 'xaml'
 * @returns {string} HEX string in specified style
 */
Color.prototype.getHEXString = function (style) {
  if (!style) style = 'css';
  return ColorUtils.rgbToHex(this, this.alpha, style);
}

Color.prototype.getscRGB = function () {
  return this.color.map(function (value) { return ColorUtils.sRGB2scRGB(value / 255) });
}

Color.prototype.getXYZ = function () {
  var rgb = this.getscRGB();
  return ColorUtils.scRGB2XYZ(rgb);
}

// TODO: http://www.brucelindbloom.com/Eqn_XYZ_to_Lab.html
Color.prototype.getLab = function () {
  return ColorUtils.RGB2Lab(this);
};

/* ----------------------------------------------------------------------- */
/* ----------------------------- Color Utils ----------------------------- */
/* ----------------------------------------------------------------------- */
var ColorUtils = (function () {
  function ColorUtils () { }
  /**
     * @param {string} hex Hex string (e.g. #FF0000). Doesn't support alpha channel
     * @returns {number[]} Array of RGB values
     */
  ColorUtils.hexToRgb = function (hex) {
    var r = parseInt(hex.substring(1, 3), 16);
    var g = parseInt(hex.substring(3, 5), 16);
    var b = parseInt(hex.substring(5, 7), 16);
    return [r, g, b];
  }

  /**
   * @param {Color} rgb Array of RGB values
   * @param {number} alpha Alpha value (0-1)
   * @param {'css'|'xaml'} style 'css' or 'xaml'
   * @returns {string} HEX string in specified style
   * @throws {Error} Invalid style
   */
  ColorUtils.rgbToHex = function (color, alpha, style) {
    var rgb = color.getColor();
    if (!alpha) alpha = 1;
    if (!style) style = 'css';
    var result = '';
    for (var i = 0; i < rgb.length; i++) {
      result += Math.round(rgb[i]).toString(16).padStart(2, '0')
    }
    if (alpha != 1) {
      switch (style.toLowerCase()) {
        case 'css':
          result += Math.round(alpha * 255).toString(16).padStart(2, '0')
          break;
        case 'xaml':
          result = Math.round(alpha * 255).toString(16).padStart(2, '0') + result;
          break;
        default:
          throw new Error('Invalid style');
      }
    }
    return '#' + result.toUpperCase();
  }

  /**
   * @param {Color} rgb Array of RGB values
   * @param {number} alpha Alpha value (0-1)
   * @param {number} precision Number of decimal places to round to
   * @returns {string} RGB string
   */
  ColorUtils.getRGBString = function (color, alpha, precision) {
    var rgb = color.getColor();
    if (!alpha) alpha = 1;
    if (!precision) precision = 0;
    var roundedRGB = rgb.map(function (value) {
      return roundWithPrecision(value, precision);
    });
    if (alpha != 1) {
      return 'rgba(' + roundedRGB[0] + ', ' + roundedRGB[1] + ', ' + roundedRGB[2] + ', ' + alpha + ')';
    } else {
      return 'rgb(' + roundedRGB[0] + ', ' + roundedRGB[1] + ', ' + roundedRGB[2] + ')';
    }
  }

  ColorUtils.sRGB2scRGB = function (normalizedValue) {
    // TODO: http://www.brucelindbloom.com/Eqn_RGB_to_XYZ.html better check Jan's PhD for sRGB standard link
    return normalizedValue <= 0.04045 ? normalizedValue / 12.92 : Math.pow((normalizedValue + 0.055) / 1.055, 2.4);
  }

  ColorUtils.scRGB2XYZ = function (rgb) {
    var X = rgb[0] * 0.4124 + rgb[1] * 0.3576 + rgb[2] * 0.1805;
    var Y = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    var Z = rgb[0] * 0.0193 + rgb[1] * 0.1192 + rgb[2] * 0.9505;
    return [X, Y, Z];
  }

  ColorUtils.RGB2Lab = function (color) {
    var xyz = color.getXYZ();
    // sRGB i.e. D65 white reference
    var X = xyz[0] / 0.95047;
    var Y = xyz[1] / 1.00000;
    var Z = xyz[2] / 1.08883;

    const kappa = 24389 / 27;
    const epsilon = 216 / 24389;

    var fX = X > epsilon ? Math.pow(X, 1 / 3) : (((kappa * X) + 16) / 116);
    var fY = Y > epsilon ? Math.pow(Y, 1 / 3) : (((kappa * Y) + 16) / 116);
    var fZ = Z > epsilon ? Math.pow(Z, 1 / 3) : (((kappa * Z) + 16) / 116);

    var L = (116 * fY) - 16;
    var a = 500 * (fX - fY);
    var b = 200 * (fY - fZ);
    return [L, a, b];
  }

  var roundWithPrecision = function (value, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  return ColorUtils;
})();




/* ----------------------------------------------------------------------- */
/* ------------------------------ Opacitron ------------------------------ */
/* ----------------------------------------------------------------------- */

var Opacitron = (function () {
  function Opacitron () { }

  /**
   * Calculates the minimum allowed opacity/alpha value for this combination of target and background colors
   * @param {Color} targetColorArr Array of RGB values representing the target color
   * @param {Color} backgroundColorArr Array of RGB values representing the background color
   * @returns {number} Minimum allowed alpha value
   */
  Opacitron.getMinimumAlpha = function (targetColor, backgroundColor) {
    var targetColorArr = targetColor.getNormalisedRGB();
    var backgroundColorArr = backgroundColor.getNormalisedRGB();
    var alphas = []
    for (var i = 0; i < 3; i++) {
      var minAlpha1 = 1 - targetColorArr[i] / backgroundColorArr[i];
      var minAlpha2 = backgroundColorArr[i] == 1 ? 0 : (backgroundColorArr[i] - targetColorArr[i]) / (backgroundColorArr[i] - 1);
      alphas[i] = Math.max(minAlpha1, minAlpha2);
    }
    var maxAlphaChannel = Math.max(alphas[0], alphas[1], alphas[2]);
    var alphaMin = Math.min(Math.round(maxAlphaChannel * 1000) / 1000, 1000);
    if (alphaMin <= 0) {
      alphaMin = Number.EPSILON;
    }
    return alphaMin;
  }

  /**
   * Calculates the resulting color when a target color is blended with a background color at a given opacity
   * @param {Color} targetColorArr
   * @param {Color} backgroundColorArr
   * @param {number} alpha
   * @returns {Color} Array of RGB values representing the resulting color
   */
  Opacitron.getResultColor = function (targetColor, backgroundColor, alpha) {
    var targetColorArr = targetColor.getColor();
    var backgroundColorArr = backgroundColor.getColor();
    var resultColor = [];
    for (var i = 0; i < 3; i++) {
      resultColor[i] = (targetColorArr[i] - (1 - alpha) * backgroundColorArr[i]) / alpha;
    }
    return new Color(resultColor, alpha);
  }

  Opacitron.deltaE = function (c1, c2) {
    var lab1 = c1.getLab();
    var lab2 = c2.getLab();

    var dL = lab1[0] - lab2[0];
    var da = lab1[1] - lab2[1];
    var db = lab1[2] - lab2[2];

    return Math.sqrt(dL * dL + da * da + db * db);
  }

  Opacitron.blendColor = function (color, backgroundColor, alpha) {
    var colorArr = color.getColor();
    var backgroundColorArr = backgroundColor.getColor();
    var resultColor = [];
    for (var i = 0; i < 3; i++) {
      resultColor[i] = (alpha * colorArr[i] + (1 - alpha) * backgroundColorArr[i]);
    }
    return new Color(resultColor);
  }

  return Opacitron
})();

if (!String.prototype.padStart) {
  String.prototype.padStart = function (length, padString) {
    var string = String(this)
    if (string.length < length) {
      for (var i = 0; i < length - string.length; i++) {
        string = padString + string;
      }
    }
    return string;
  }
}
