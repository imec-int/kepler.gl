// Copyright (c) 2023 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import GL from '@luma.gl/constants';
import {BitmapLayer} from '@deck.gl/layers';
import {Texture2D} from '@luma.gl/webgl';

// Define a new bitmap layer type that can receive binary image data
class FloatBitmapLayer extends BitmapLayer {
  initializeState() {
    super.initializeState();
    const {gl} = this.context;
    const {binaryData, colorScale, width, height} = this.props;

    // Preallocate the color array (RGBA)
    const coloredData = new Uint8Array(binaryData.length * 4);

    // Convert color legend colors to rgb
    const colorScaleRGB = colorScale.colors.map(color => hexToUnsignedInt(color));

    binaryData.forEach((value, index) => {
      const i = index * 4;
      value = Math.max(0, value);
      // Find the index of the value based on the ranges
      let colorIndex = colorScale.ranges.findIndex(range => value <= range);

      // If the value is out of range, use the first color
      colorIndex = colorIndex === -1 ? 0 : colorIndex;

      const color = colorScaleRGB[colorIndex];
      coloredData[i] = color[0];
      coloredData[i + 1] = color[1];
      coloredData[i + 2] = color[2];
      // If the color has an alpha channel, use it
      if (color.length === 4) coloredData[i + 3] = color[3];
      else coloredData[i + 3] = 255;
    });

    const image = new Texture2D(gl, {
      data: coloredData,
      format: gl.RGBA,
      mipmaps: false,
      width,
      height,
      parameters: {
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
      },
      compressed: false
    });

    this.setState({image});
  }

  draw(opts) {
    const {uniforms, moduleParameters} = opts;
    const {model, coordinateConversion, bounds, disablePicking, image} = this.state;

    if (moduleParameters.pickingActive && disablePicking) {
      return;
    }

    // Render the image
    if (image && model) {
      model
        .setUniforms(uniforms)
        .setUniforms({
          bitmapTexture: image,
          coordinateConversion,
          tintColor: [1, 1, 1],
          transparentColor: [0, 0, 0, 0],
          desaturate: 0,
          bounds
        })
        .draw();
    }
  }

  finalizeState() {
    super.finalizeState(this.context);
    const {image} = this.state;

    // Cleanup the texture when the layer is removed
    if (image) {
      image.delete();
    }
  }
}

export default FloatBitmapLayer;

function hexToUnsignedInt(input) {
  // Drop the # if it exists
  if (input[0] === '#') {
    input = input.substring(1);
  }
  const channels = input.length / 2;
  var colors = new Uint8Array(channels);
  for (var n = 0; n < input.length; n++) {
    colors[n] = parseInt(input.substring(n * 2, n * 2 + 2), 16);
  }
  return colors;
}
