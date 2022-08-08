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

import {BrushingExtension} from '@deck.gl/extensions';
import {IconLayer, LineLayer} from '@deck.gl/layers';
import {getTextOffsetByRadius, formatTextLabelData} from '../layer-text-label';

import Layer from '../base-layer';
import {hexToRgb} from 'utils/color-utils';
import {findDefaultColorField} from 'utils/dataset-utils';
import GraphLayerIcon from './graph-layer-icon';
import {DEFAULT_LAYER_COLOR} from 'constants/default-settings';

export const pointPosAccessor = ({coordinates, type}) => dc => d => {
  if (!type || !coordinates) {
    return null;
  }
  if (dc.valueAt(d.index, type.fieldIdx) === 'node') {
    return dc.valueAt(d.index, coordinates.fieldIdx);
  }
  const [fromLat, fromLng, toLat, toLng] = dc.valueAt(d.index, coordinates.fieldIdx);
  return {
    from: [fromLat, fromLng],
    to: [toLat, toLng]
  };
};

const brushingExtension = new BrushingExtension();

export default class GraphLayer extends Layer {
  constructor(props) {
    super(props);

    this.getPositionAccessor = dataContainer => {
      return pointPosAccessor(this.config.columns)(dataContainer);
    };
  }

  get type() {
    return 'graph';
  }

  get isAggregated() {
    return false;
  }

  get layerIcon() {
    return GraphLayerIcon;
  }

  get noneLayerDataAffectingProps() {
    return [...super.noneLayerDataAffectingProps, 'radius'];
  }

  setInitialLayerConfig(dataset) {
    const defaultColorField = findDefaultColorField(dataset);

    if (defaultColorField) {
      this.updateLayerConfig({
        colorField: defaultColorField
      });
      this.updateLayerVisualChannel(dataset, 'color');
    }

    return this;
  }

  static findDefaultLayerProps({fieldPairs = []}) {
    const props = [];

    // Make layer for each pair
    fieldPairs.forEach(pair => {
      const latField = pair.pair.lat;
      const lngField = pair.pair.lng;
      const layerName = pair.defaultName;

      const prop = {
        label: layerName.length ? layerName : 'Point'
      };

      // default layer color for begintrip and dropoff point
      if (latField.value in DEFAULT_LAYER_COLOR) {
        prop.color = hexToRgb(DEFAULT_LAYER_COLOR[latField.value]);
      }

      // set the first layer to be visible
      if (props.length === 0) {
        prop.isVisible = true;
      }

      prop.columns = {
        lat: latField,
        lng: lngField,
        altitude: {value: null, fieldIdx: -1, optional: true}
      };

      props.push(prop);
    });

    return {props};
  }

  getDefaultLayerConfig(props = {}) {
    return {
      ...super.getDefaultLayerConfig(props)
    };
  }

  calculateFieldsToColumns(fields) {
    const columns = {};
    const fieldsToMap = ['coordinates', 'type'];

    fieldsToMap.forEach(name => {
      const field = fields.find(({id}) => id === name);
      if (field) {
        columns[field.id] = {value: field.id, fieldIdx: field.fieldIdx};
      }
    });

    return columns;
  }

  updateData(datasets, oldLayerData) {
    if (!this.config.dataId) {
      return {};
    }
    const layerDataset = datasets[this.config.dataId];
    const {dataContainer} = layerDataset;

    const columns = this.calculateFieldsToColumns(layerDataset.fields);
    if (!Object.keys(this.config.columns).length) {
      this.updateLayerConfig({columns});
    }

    const getPosition = this.getPositionAccessor(dataContainer);
    const dataUpdateTriggers = this.getDataUpdateTriggers(layerDataset);
    const triggerChanged = this.getChangedTriggers(dataUpdateTriggers);
    if (triggerChanged.getMeta) {
      this.updateLayerMeta(dataContainer, getPosition);
    }

    let data = [];

    if (!triggerChanged.getData && oldLayerData && oldLayerData.data) {
      // same data
      data = oldLayerData.data;
    } else {
      data = this.calculateDataAttribute(layerDataset, getPosition);
    }

    return {data, triggerChanged};
  }

  calculateDataAttribute({fields, filteredIndex, dataContainer}, getPosition) {
    const data = [];

    for (let i = 0; i < filteredIndex.length; i++) {
      const index = filteredIndex[i];
      const type = dataContainer.valueAt(index, 16);
      const pos = getPosition({index, type});

      // if doesn't have point lat or lng, do not add the point
      // deck.gl can't handle position = null
      if (
        Array.isArray(pos)
          ? pos?.every(Number.isFinite)
          : pos?.from.every(Number.isFinite) && pos?.to.every(Number.isFinite)
      ) {
        data.push({
          coordinates: pos,
          index,
          type
        });
      }
    }

    return data;
  }

  formatLayerData(datasets, oldLayerData) {
    const {gpuFilter, dataContainer} = datasets[this.config.dataId];
    const {data} = this.updateData(datasets, oldLayerData);
    const getPosition = this.getPositionAccessor(dataContainer);

    const accessors = this.getAttributeAccessors({dataContainer});
    const nodes = data.filter(d => d.type === 'node');
    const edges = data.filter(d => d.type === 'edge');

    return {
      data,
      nodes,
      edges,
      getPosition,
      getFilterValue: gpuFilter.filterValueAccessor(dataContainer)(),
      ...accessors
    };
  }

  updateLayerMeta(dataContainer) {
    const getPosition = this.getPositionAccessor(dataContainer);
    const bounds = this.getPointsBounds(dataContainer, getPosition);
    this.updateMeta({bounds});
  }

  renderLayer(opts) {
    const {
      // eslint-disable-next-line no-unused-vars
      data: {data: not_in_use, nodes, edges, ...data},
      gpuFilter,
      interactionConfig,
      mapState,
      objectHovered
    } = opts;

    console.log(nodes, edges);

    const fixedRadius = this.config.visConfig.fixedRadius && Boolean(this.config.sizeField);
    const radiusScale = this.getRadiusScaleByZoom(mapState, fixedRadius);

    const layerProps = {
      stroked: this.config.visConfig.outline,
      filled: this.config.visConfig.filled,
      lineWidthScale: this.config.visConfig.thickness,
      radiusScale,
      ...(this.config.visConfig.fixedRadius ? {} : {radiusMaxPixels: 500})
    };

    const updateTriggers = {
      getPosition: this.config.columns,
      getFilterValue: gpuFilter.filterValueUpdateTriggers,
      ...this.getVisualChannelUpdateTriggers()
    };

    const defaultLayerProps = this.getDefaultDeckLayerProps(opts);
    const brushingProps = this.getBrushingExtensionProps(interactionConfig);
    const getPixelOffset = getTextOffsetByRadius(radiusScale, data.getRadius, mapState);
    const extensions = [...defaultLayerProps.extensions, brushingExtension];

    const sharedProps = {
      getFilterValue: data.getFilterValue,
      extensions,
      filterRange: defaultLayerProps.filterRange,
      visible: defaultLayerProps.visible,
      ...brushingProps
    };
    const hoveredObject = this.hasHoveredObject(objectHovered);

    return [
      new IconLayer({
        ...defaultLayerProps,
        ...brushingProps,
        // ...layerProps,
        ...data,
        data: nodes,
        parameters: {
          depthTest: this.config.columns.altitude?.fieldIdx > -1
        },
        lineWidthUnits: 'pixels',
        updateTriggers,
        extensions,

        // IconLayer stuff
        getIcon: _ => ({
          url: 'https://stcitiespublic.blob.core.windows.net/assets/precinct/marker.png',
          width: 480,
          height: 750,
          anchorY: 750
        }),
        getSize: 25
      })
      // new LineLayer({
      //   ...defaultLayerProps,
      //   ...brushingProps,
      //   ...data,
      //   data: edges,
      //   parameters: {
      //     // circles will be flat on the map when the altitude column is not used
      //     depthTest: this.config.columns.altitude?.fieldIdx > -1
      //   },
      //   lineWidthUnits: 'pixels',
      //   updateTriggers,
      //   extensions,

      //   getWidth: 25,
      //   getSourcePosition: d => d.coordinates.from,
      //   getTargetPosition: d => d.coordinates.to
      // })
    ];
  }
}
