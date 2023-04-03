// Copyright (c) 2022 Uber Technologies, Inc.
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
import {TileLayer as DeckGLTileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import TileLayerIcon from './tile-layer-icon';

export const TileLayerVisConfigs = {
  opacity: 'opacity',
  thickness: 'thickness',
  colorRange: 'colorRange',
  sizeRange: 'strokeWidthRange',
  targetColor: 'targetColor'
};

export default class TileLayer extends Layer {
  constructor(props) {
    super(props);

    this.registerVisConfig(TileLayerVisConfigs);
  }

  get type() {
    return 'tile';
  }

  get layerIcon() {
    return TileLayerIcon;
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {dataContainer} = datasets[this.config.dataId];
    // extract URL from row 0 column 0
    const newUrl = dataContainer.valueAt(0, 0);
    const oldUrl = oldLayerData ? oldLayerData.url : undefined;
    let url = oldUrl;
    if (oldUrl !== newUrl) {
      url = newUrl;
    }
    const accessors = this.getAttributeAccessors({
      dataAccessor: dc => d => d,
      dataContainer
    });
    return {
      url,
      ...accessors
    };
  }

  shouldRenderLayer() {
    return typeof this.type === 'string' && this.config.isVisible && this.hasAllColumns();
  }

  renderLayer(opts) {
    const {data} = opts;
    const {url} = data;

    // Create new deck.gl Tile Layer with Bitmap sublayers
    return [
      new DeckGLTileLayer({
        data: url,
        minZoom: 0,
        maxZoom: 19,
        tileSize: 512,

        // TODO: check if we can use this function to fetch tiles, and suppress the console errors
        // getTileData: async tile => {
        // const response = await fetch(tile.url);
        // console.log(response);
        // if (response.ok) {
        //   return Promise.resolve(streamToBlob(response.body, 'image/png'));
        // }
        // return null;
        // },

        renderSubLayers: props => {
          const {
            bbox: {west, south, east, north}
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north]
          });
        },
        onTileError: error => {
          // do nothing! :D
          // console.error('Tile error', error);
          return error;
        }
      })
    ];
  }
}
