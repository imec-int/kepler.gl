import Layer from '../base-layer';
import {TileLayer as DeckGLTileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {ArcLayerConfig} from '../arc-layer/arc-layer';
import {
  LayerVisConfigSettings,
  VisConfigColorRange,
  VisConfigColorSelect,
  VisConfigNumber,
  VisConfigRange
} from '../layer-factory';
import {ColorRange} from '../../constants/dist';
import {RGBColor, ValueOf} from '@kepler.gl/types';

export type TileLayerVisConfigSettings = {
  opacity: VisConfigNumber;
  thickness: VisConfigNumber;
  colorRange: VisConfigColorRange;
  sizeRange: VisConfigRange;
  targetColor: VisConfigColorSelect;
};

export type TileLayerVisConfig = {
  colorRange: ColorRange;
  opacity: number;
  sizeRange: [number, number];
  targetColor: RGBColor;
  thickness: number;
};

export type TileLayerConfig = ArcLayerConfig;
export const TileLayerVisConfigs: {
  [key: string]: keyof LayerVisConfigSettings | ValueOf<LayerVisConfigSettings>;
} = {
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

  static get type(): 'tile' {
    return 'tile';
  }
  get type() {
    return TileLayer.type;
  }

  get name(): 'Tile' {
    return 'Tile';
  }

  get visualChannels() {
    return {
      sourceColor: {
        ...super.visualChannels.color,
        property: 'color',
        key: 'sourceColor',
        accessor: 'getSourceColor',
        defaultValue: config => config.color
      },
      targetColor: {
        ...super.visualChannels.color,
        property: 'targetColor',
        key: 'targetColor',
        accessor: 'getTargetColor',
        defaultValue: config => config.visConfig.targetColor || config.color
      },
      size: {
        ...super.visualChannels.size,
        accessor: 'getWidth',
        property: 'stroke'
      }
    };
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {dataContainer} = datasets[this.config.dataId];
    // const {data} = this.updateData(datasets, oldLayerData);
    // TODO: add check to compare url to oldLayerData
    const accessors = this.getAttributeAccessors({dataContainer});
    // extract URL from row 0 column 0
    const url = dataContainer.valueAt(0, 0);
    return {
      url,
      ...accessors
    };
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

        renderSubLayers: props => {
          const {
            bbox: {west, south, east, north}
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north]
          });
        }
      })
    ];
  }
}
