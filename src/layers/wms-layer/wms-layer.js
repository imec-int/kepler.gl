import Layer from '../base-layer';
import {TileLayer as DeckGLTileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import WMSLayerIcon from './wms-layer-icon';
import {load} from '@loaders.gl/core';

export const WMSLayerVisConfigs = {
  opacity: 'opacity',
  thickness: 'thickness',
  colorRange: 'colorRange',
  sizeRange: 'strokeWidthRange',
  targetColor: 'targetColor'
};

export default class WMSLayer extends Layer {
  constructor(props) {
    super(props);

    this.registerVisConfig(WMSLayerVisConfigs);
  }

  get type() {
    return 'wms';
  }

  get layerIcon() {
    return WMSLayerIcon;
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {dataContainer} = datasets[this.config.dataId];
    // extract URL from row 0 column 0
    const newUrl = dataContainer.valueAt(0, 0);
    const styles = dataContainer.valueAt(0, 2);
    const crs = dataContainer.valueAt(0, 1);
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
      styles,
      crs,
      ...accessors
    };
  }

  shouldRenderLayer() {
    return typeof this.type === 'string' && this.config.isVisible && this.hasAllColumns();
  }

  renderLayer(opts) {
    const {data} = opts;
    const {url, crs, styles} = data;

    // Create new deck.gl WMS Layer with Bitmap sublayers
    return [
      new DeckGLTileLayer({
        data: url,
        minZoom: 0,
        maxZoom: 19,
        tileSize: 512,

        getTileData(tile) {
          const wmsUrl = url;
          const {bbox} = tile;
          const {east, north, south, west} = bbox;
          const urlQueryStringParams = {
            bbox: [west, south, east, north].join(','),
            format: 'image/png',
            height: 512,
            request: 'GetMap',
            service: 'WMS',
            srs: crs ? crs : 'EPSG:4326',
            styles: styles ? styles : '',
            version: '1.1.1',
            width: 512,
            transparent: 'true'
          };
          const urlQueryString = Object.keys(urlQueryStringParams)
            .map(key => `${key}=${urlQueryStringParams[key]}`)
            .join('&');

          return load(`${wmsUrl}&${urlQueryString}`);
        },

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
        onTileError: () => {
          return;
        }
      })
    ];
  }
}
