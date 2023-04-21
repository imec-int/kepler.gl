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

import Layer from '../base-layer';
import BitmapLayer from '../../deckgl-layers/float-bitmap-layer/float-bitmap-layer';
import wktParser from 'wellknown';

export const BitmapLayerVisConfigs = {
  colorRange: 'colorRange',
  sizeRange: 'strokeWidthRange',
  targetColor: 'targetColor'
};

export default class FloatBitmapLayer extends Layer {
  constructor(props) {
    super(props);

    this.registerVisConfig(BitmapLayerVisConfigs);
  }

  get type() {
    return 'floatbitmap';
  }

  get name() {
    return 'floatbitmap';
  }

  get visualChannels() {
    return {
      color: {
        ...super.visualChannels.color,
        accessor: 'getFillColor',
        condition: config => config.visConfig.filled,
        defaultValue: config => config.color
      },
      strokeColor: {
        property: 'strokeColor',
        key: 'strokeColor',
        field: 'strokeColorField',
        scale: 'strokeColorScale',
        domain: 'strokeColorDomain',
        range: 'strokeColorRange',
        accessor: 'getLineColor',
        condition: config => config.visConfig.outline,
        defaultValue: config => config.visConfig.strokeColor || config.color
      },
      size: {
        ...super.visualChannels.size,
        property: 'radius',
        range: 'radiusRange',
        fixed: 'fixedRadius',
        channelScaleType: 'radius',
        accessor: 'getRadius',
        defaultValue: 1
      }
    };
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {dataContainer} = datasets[this.config.dataId];
    // extract URL from row 0 column 0
    const width = dataContainer.valueAt(0, 0);
    const height = dataContainer.valueAt(0, 1);
    const rawTopLeft = dataContainer.valueAt(0, 2);
    const rawBottomRight = dataContainer.valueAt(0, 3);
    const rawData = dataContainer.valueAt(0, 4);
    // Remove evertyhing before (
    let parsedData = rawData.substring(rawData.indexOf('(') + 1, rawData.length - 1);
    parsedData = parsedData.split(' ').map(d => parseFloat(d));
    const data = Float64Array.from(parsedData);

    const topLeft = wktParser(rawTopLeft);
    const bottomRight = wktParser(rawBottomRight);

    // const oldUrl = oldLayerData ? oldLayerData.url : undefined;
    const accessors = this.getAttributeAccessors({
      dataAccessor: dc => d => d,
      dataContainer
    });
    return {
      data,
      width,
      height,
      topLeft,
      bottomRight,
      ...accessors
    };
  }

  renderLayer(opts) {
    const {data} = opts;
    // Create new deck.gl Tile Layer with Bitmap sublayers
    return [
      new BitmapLayer({
        id: 'binary-bitmap-layer',
        binaryData: data.data,
        width: data.width,
        height: data.height,
        bounds: [
          data.topLeft.coordinates[0],
          data.topLeft.coordinates[1],
          data.bottomRight.coordinates[0],
          data.bottomRight.coordinates[1]
        ],
        colorScale: {
          ranges: [0, 0.1, 0.3, 0.6, 0.8, 1, 1.5],
          colors: [
            '#00000000',
            '#eaf5fdaa',
            '#bbdefbaa',
            '#42a5f5',
            '#1e88e5',
            '#1565c0',
            '#0d47a1'
          ]
        },
        loadOptions: {
          imagebitmap: {
            premultiplyAlpha: 'premultiply'
          }
        }
      })
    ];
  }
}
