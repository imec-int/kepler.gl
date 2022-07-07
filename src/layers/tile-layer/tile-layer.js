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

  // get visualChannels() {
  //   return {
  //     color: {
  //       ...super.visualChannels.color,
  //       property: 'color',
  //       key: 'sourceColor',
  //       accessor: 'getSourceColor',
  //       defaultValue: config => config.color
  //     },
  //     targetColor: {
  //       ...super.visualChannels.color,
  //       property: 'targetColor',
  //       key: 'targetColor',
  //       accessor: 'getTargetColor',
  //       defaultValue: config => config.visConfig.targetColor || config.color
  //     },
  //     size: {
  //       ...super.visualChannels.size,
  //       accessor: 'getWidth',
  //       property: 'stroke'
  //     }
  //   };
  // }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {dataContainer} = datasets[this.config.dataId];
    // extract URL from row 0 column 0
    const newUrl = dataContainer.valueAt(0, 0);
    const oldUrl = oldLayerData ? oldLayerData.url : undefined;
    console.log(oldLayerData);
    let url = oldUrl;
    console.log(oldUrl, newUrl);
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
