var resultRGBElement, resultP3Element, resultHEXCSSElement, resultHEXXAMLElement, colorSpaceElement;
var resconstructedRGB, reconstructedError;
var backgroundColorElement, targetColorElement, resultColorElement;
var colorPicker, backgroundPicker, opacitySlider, opacitySliderValue;
var colorPickerValue;
var alphaMinElement, alphaMaxElement, alphaErrorElement;

if (Number.EPSILON === undefined) {
  Number.EPSILON = Math.pow(2, -52);
}

function ready(callbackFunc) {
  if (document.readyState !== 'loading') {
    callbackFunc();
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callbackFunc);
  } else {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState === 'complete') {
        callbackFunc();
      }
    });
  }
}

function init() {
  resultRGBElement = document.getElementById('result-srgb');
  resultP3Element = document.getElementById('result-p3');
  resultHEXCSSElement = document.getElementById('result-hex-css');
  resultHEXXAMLElement = document.getElementById('result-hex-xaml');
  colorSpaceElement = document.getElementById('gamut-label');
  resconstructedRGB = document.getElementById('reconstructed-rgb');
  reconstructedError = document.getElementById('reconstructed-error');
  backgroundColorElement = document.getElementById('color-background');
  targetColorElement = document.getElementById('target-color');
  resultColorElement = document.getElementById('result-color');
  colorPicker = document.getElementById('color-picker');
  backgroundPicker = document.getElementById('background-picker');
  opacitySlider = document.getElementById('opacity-slider');
  opacitySliderValue = document.getElementById('opacity-slider-value');
  alphaMinElement = document.getElementById('alpha-min');
  alphaMaxElement = document.getElementById('alpha-max');
  alphaErrorElement = document.getElementById('alpha-error');
  colorPickerValue = document.getElementById('color-picker-value');
  updateColor();
}

function updateColor() {
  var targetColor = new Color(colorPicker.value);
  var backgroundColor = new Color(backgroundPicker.value);

  var minimumAlpha = Opacitron.getMinimumAlpha(targetColor, backgroundColor);

  alphaMinElement.innerText = minimumAlpha;
  opacitySlider.min = minimumAlpha;
  opacitySlider.value = minimumAlpha;
  opacitySliderValue.innerText = minimumAlpha;

  if (minimumAlpha >= 1) {
    opacitySlider.classList.add('hide');
    alphaMinElement.classList.add('hide');
    alphaMaxElement.classList.add('hide');
    alphaErrorElement.classList.remove('hide');
  } else {
    opacitySlider.classList.remove('hide');
    alphaMinElement.classList.remove('hide');
    alphaMaxElement.classList.remove('hide');
    alphaErrorElement.classList.add('hide');
  }

  backgroundColorElement.style.backgroundColor = backgroundColor.getColorString();
  targetColorElement.style.backgroundColor = targetColor.getColorString();
  colorPickerValue.innerText = targetColor.getRGBString();
  colorSpaceElement.innerText = getColorSpace()

  opacitronify(targetColor, backgroundColor, minimumAlpha);
}

function updateOpacity() {
  var targetColor = new Color(colorPicker.value);
  var backgroundColor = new Color(backgroundPicker.value);
  var alpha = opacitySlider.value;

  opacitySliderValue.innerText = alpha;

  backgroundColorElement.style.backgroundColor = backgroundColor.getColorString();
  targetColorElement.style.backgroundColor = targetColor.getColorString();
  colorPickerValue.innerText = targetColor.getRGBString();
  colorSpaceElement.innerText = getColorSpace()

  opacitronify(targetColor, backgroundColor, alpha);
}

function opacitronify(targetColor, backgroundColor, alpha) {
  var resultColor = Opacitron.getResultColor(targetColor, backgroundColor, alpha);
  resultColorElement.style.backgroundColor = resultColor.getColorString();
  resultRGBElement.innerText = resultColor.getRGBString();
  resultP3Element.innerText = resultColor.getP3String();
  resultHEXCSSElement.innerText = resultColor.getHEXString('css');
  resultHEXXAMLElement.innerText = resultColor.getHEXString('xaml');

  var resultColorFromHex = new Color(resultColor.getHEXString('css').substring(0, 7));

  var composedColor = Opacitron.blendColor(resultColorFromHex, backgroundColor, alpha);
  resconstructedRGB.innerText = composedColor.getRGBString(3);
  var error = Opacitron.deltaE(targetColor, composedColor);
  reconstructedError.innerText = error.toFixed(2);
}

function getColorSpace() {
  var hasP3Color = window
  .matchMedia('(color-gamut: p3)')
  .matches;
  if (hasP3Color) {
    return 'Display P3'
  } else {
    return 'sRGB'
  }
}

ready(init);
