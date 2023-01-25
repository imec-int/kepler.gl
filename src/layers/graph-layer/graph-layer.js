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
import {IconLayer, LineLayer, ScatterplotLayer} from '@deck.gl/layers';

import {CHANNEL_SCALES} from 'constants/default-settings';
import Layer from '../base-layer';
import {findDefaultColorField} from 'utils/dataset-utils';
import GraphLayerIcon from './graph-layer-icon';

export const iconPosAccessor = ({icon}) => dc => d => {
  if (!icon) {
    return null;
  }

  // TODO: These dimensions are hardcoded as a temporary solution. We should have a set of fixed icons, or add the dimensions to the graph definition.
  return {
    url: dc.valueAt(d.index, icon.fieldIdx),
    width: 64,
    height: 64,
    mask: true
  };
};

export const graphPosAccessor = ({coordinates, type}) => dc => d => {
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

export const graphVisConfigs = {
  opacity: 'opacity',
  strokeColor: 'strokeColor',
  colorRange: 'colorRange',
  strokeColorRange: 'strokeColorRange',
  sizeRange: 'strokeWidthRange',
  radiusRange: 'radiusRange',
  heightRange: 'elevationRange',
  radius: 'radius',
  fixedRadius: 'fixedRadius',
  outline: 'outline',
  thickness: 'thickness',
  filled: {
    type: 'boolean',
    label: 'layer.fillColor',
    defaultValue: true,
    property: 'filled'
  }
};

export default class GraphLayer extends Layer {
  constructor(props) {
    super(props);

    this.registerVisConfig(graphVisConfigs);
    this.getPositionAccessor = dataContainer => {
      return graphPosAccessor(this.config.columns)(dataContainer);
    };
    this.getIconAccessor = dataContainer => {
      return iconPosAccessor(this.config.columns)(dataContainer);
    };
  }

  get name() {
    return 'Graph';
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

  get visualChannels() {
    return {
      color: {
        ...super.visualChannels.color,
        accessor: 'getIconColor',
        defaultValue: config => config.color || [157, 255, 255]
      },
      strokeColor: {
        property: 'strokeColor',
        key: 'strokeColor',
        field: 'strokeColorField',
        scale: 'strokeColorScale',
        domain: 'strokeColorDomain',
        range: 'strokeColorRange',
        channelScaleType: CHANNEL_SCALES.color,
        accessor: 'getLineColor',
        defaultValue: config => config.visConfig.strokeColor || [63, 152, 189]
      }
    };
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

  getDefaultLayerConfig(props = {}) {
    return {
      ...super.getDefaultLayerConfig(props),

      // add stroke color visual channel
      strokeColorField: null,
      strokeColorDomain: [0, 1],
      strokeColorScale: 'quantile'
    };
  }

  // Calculates the column index for all fields which require to be searched
  calculateFieldsToColumns(fields) {
    const columns = {};
    const fieldsToMap = ['coordinates', 'type', 'icon'];

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
    const typeIdx = fields.find(field => field.name === 'type').fieldIdx;

    for (let i = 0; i < filteredIndex.length; i++) {
      const index = filteredIndex[i];
      const type = dataContainer.valueAt(index, typeIdx);
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
    const getIcon = this.getIconAccessor(dataContainer);

    const accessors = this.getAttributeAccessors({dataContainer});
    const nodes = data.filter(d => d.type === 'node');
    const edges = data.filter(d => d.type === 'edge');

    return {
      data,
      nodes,
      edges,
      getPosition,
      getIcon,
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
      mapState
    } = opts;

    const radiusScale = this.getRadiusScaleByZoom(mapState, false);

    const updateTriggers = {
      getPosition: this.config.columns,
      getFilterValue: gpuFilter.filterValueUpdateTriggers,
      ...this.getVisualChannelUpdateTriggers()
    };

    const defaultLayerProps = this.getDefaultDeckLayerProps(opts);
    const brushingProps = this.getBrushingExtensionProps(interactionConfig);
    const extensions = [...defaultLayerProps.extensions, brushingExtension];

    return [
      // White background border for accentuating the edges. This is clickable.
      new LineLayer({
        ...defaultLayerProps,
        ...brushingProps,
        ...data,
        id: `edges-${defaultLayerProps.id}`,
        idx: defaultLayerProps.idx,
        data: edges,
        updateTriggers,
        extensions,
        parameters: {
          // circles will be flat on the map when the altitude column is not used
          depthTest: this.config.columns.altitude?.fieldIdx > -1
        },

        // LineLayer properties
        getColor: [255, 255, 255], // Background line is always white right now
        getWidth: d => 8,
        lineWidthUnits: 'pixels',
        getSourcePosition: d => d.coordinates.from,
        getTargetPosition: d => d.coordinates.to
      }),
      // Foreground layer for the edges, not clickable. This contains the actual color of the edge.
      new LineLayer({
        ...defaultLayerProps,
        id: `edges-${defaultLayerProps.id}-color`,
        idx: defaultLayerProps.idx,
        ...data,
        data: edges,
        updateTriggers,
        parameters: {
          // circles will be flat on the map when the altitude column is not used
          depthTest: this.config.columns.altitude?.fieldIdx > -1
        },

        // LineLayer properties
        getColor: data.getLineColor,
        getWidth: d => 3,
        lineWidthUnits: 'pixels',
        getSourcePosition: d => d.coordinates.from,
        getTargetPosition: d => d.coordinates.to
      }),
      // We use a "billboard" scatterplot for the circle background of each icon. This is clickable
      new ScatterplotLayer({
        ...defaultLayerProps,
        ...brushingProps,
        ...data,
        id: `nodes-${defaultLayerProps.id}`,
        idx: defaultLayerProps.idx,
        updateTriggers,
        extensions,
        parameters: {
          // circles will be flat on the map when the altitude column is not used
          depthTest: this.config.columns.altitude?.fieldIdx > -1
        },

        // ScatterplotLayer properties
        billboard: true,
        filled: true,
        stroked: true,
        data: nodes,
        getPosition: d => d.coordinates,

        getRadius: d => 22,
        radiusUnits: 'pixels',
        getFillColor: data.getIconColor,

        getLineWidth: d => 2,
        lineWidthUnits: 'pixels',
        getLineColor: data.getLineColor,

        radiusScale,
        lineWidthScale: radiusScale
      }),
      // The icon visible inside the circle background, not clickable.
      new IconLayer({
        ...defaultLayerProps,
        id: `nodes-${defaultLayerProps.id}-icons`,
        idx: defaultLayerProps.idx,
        ...data,
        data: nodes,
        updateTriggers,
        parameters: {
          // circles will be flat on the map when the altitude column is not used
          depthTest: this.config.columns.altitude?.fieldIdx > -1
        },

        loadOptions: {
          imagebitmap: {
            resizeWidth: 200,
            resizeHeight: 200
          }
        },
        // IconLayer properties
        getSize: d => 20,
        sizeUnits: 'pixels',
        getColor: data.getLineColor,
        sizeScale: radiusScale + 0.6
      })
    ];
  }
}
