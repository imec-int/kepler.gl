import Layer from '../base-layer';
import {TileLayer as DeckGLTileLayer} from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';
import {ArcLayerConfig} from '../arc-layer/arc-layer';
import {
  VisConfigColorRange,
  VisConfigColorSelect,
  VisConfigNumber,
  VisConfigRange
} from '../layer-factory';
import {ColorRange} from '../../constants/color-ranges';
import {RGBColor} from '../../reducers';

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
export const TileLayerVisConfigs = {
  label: 'Tile Layer',
  opacity: 'opacity',
  thickness: 'thickness',
  colorRange: 'colorRange',
  sizeRange: 'strokeWidthRange',
  targetColor: 'targetColor'
};

export default class TileLayer extends Layer {
  constructor(props) {
    super(props);

    console.log(props);

    //this.dataToFeature = [];
    this.registerVisConfig(TileLayerVisConfigs);
    // this.getPositionAccessor = dataContainer => featureAccessor(this.config.columns)(dataContainer);
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
    const {gpuFilter, dataContainer} = datasets[this.config.dataId];
    // const {data} = this.updateData(datasets, oldLayerData);
    const accessors = this.getAttributeAccessors({dataContainer});
    // extract URL from row 0 column 0
    const url = dataContainer.valueAt(0, 0);
    return {
      url,
      getFilterValue: gpuFilter.filterValueAccessor(dataContainer)(),
      ...accessors
    };
  }

  renderLayer(opts) {
    const {data, gpuFilter, mapState, animationConfig} = opts;
    const {url} = data;
    // bruges "bbox":[3.13411428025064,51.1581663498427,3.31021706015834,51.3632960133711]
    // const imageBounds: ExtentsLeftBottomRightTop = [4.34017, 51.155, 4.49769, 51.2628];
    // const props = {
    //   // data: `https://digdemodata.blob.core.windows.net/vito/StandardPeriod/pm10Precalculated/pm10_atmo_street-20190121-0700UT.webp`,
    //   data:
    //     'http://localhost:8085/geoserver/geoserver-imec/wms?service=WMS&version=1.1.0&request=GetMap&layers=geoserver-imec%3Apm10_atmo_street-20190121-0600UT&bbox=148000.0%2C205000.0%2C159000.0%2C217000.0&width=704&height=768&srs=EPSG%3A31370&styles=&format=image%2Fpng',
    //   bounds: imageBounds
    // };
    // return new BitmapLayer({
    //   data: null,
    //   image: props.data,
    //   bounds: props.bounds
    // });
    //          'http://localhost:8085/geoserver/gwc/service/wmts?layer=geoserver-imec%3Apm10_atmo_street-20190121-0600UT&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG:4326:{z}&TileCol={x}&TileRow={y}',

    // http://localhost:8080/geoserver/gwc/service/tms/1.0.0/test:Curb_Segments@EPSG%3A900913@png/{z}/{x}/{-y}.png
    return [
      new DeckGLTileLayer({
        data: url,
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,

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
