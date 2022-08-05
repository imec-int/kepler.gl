import Layer from '../base-layer';
import {IconLayer, LineLayer} from '@deck.gl/layers';
import GraphLayerIcon from './graph-layer-icon';

export const GraphLayerVisConfigs = {
  opacity: 'opacity',
  thickness: 'thickness',
  colorRange: 'colorRange',
  sizeRange: 'strokeWidthRange',
  targetColor: 'targetColor'
};

export default class GraphLayer extends Layer {
  constructor(props) {
    super(props);

    this.registerVisConfig(GraphLayerVisConfigs);
  }

  get type() {
    return 'graph';
  }

  get layerIcon() {
    return GraphLayerIcon;
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

  parseGraph(nodes, edges) {
    const nodeMap = {};
    const mappedNodes = [];
    const mappedEdges = [];

    nodes.forEach(node => {
      const {
        metadata: {x, y, ...metadata},
        ...rest
      } = node;

      const mappedNode = {
        ...rest,
        ...metadata,
        coordinates: [x, y]
      };

      nodeMap[rest.id] = mappedNode;
      mappedNodes.push(mappedNode);
    });

    edges.forEach(edge => {
      const {source, target, ...rest} = edge;

      const from = nodeMap[source];
      const to = nodeMap[target];

      mappedEdges.push({
        ...rest,
        from: {
          label: from.label,
          coordinates: from.coordinates
        },
        to: {
          label: to.label,
          coordinates: to.coordinates
        }
      });
    });

    return {nodes: mappedNodes, edges: mappedEdges};
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }

    const {dataContainer, gpuFilter} = datasets[this.config.dataId];

    // extract nodes from row 0 column 2
    const nodes = dataContainer.valueAt(0, 2);
    // extract edges from row 0 column 3
    const edges = dataContainer.valueAt(0, 3);

    const accessors = this.getAttributeAccessors({
      dataContainer
    });

    return {
      data: this.parseGraph(nodes, edges),
      getFilterValue: gpuFilter.filterValueAccessor(dataContainer)(),
      ...accessors
    };
  }

  shouldRenderLayer() {
    return typeof this.type === 'string' && this.config.isVisible && this.hasAllColumns();
  }

  renderLayer(opts) {
    const {data} = opts;

    // Create new deck.gl Graph Layer with Bitmap sublayers
    return [
      // new IconLayer({
      //   id: `icon-${this.id}`,
      //   data: data.data.nodes,
      //   // iconAtlas and iconMapping should not be provided
      //   // getIcon return an object which contains url to fetch icon of each data point
      //   getIcon: d => ({
      //     url: d.icon,
      //     width: 128,
      //     height: 128,
      //     anchorY: 128
      //   }),
      //   // icon size is based on data point's contributions, between 2 - 25
      //   getSize: d => 10,
      //   sizeScale: 15,
      //   getPosition: d => d.coordinates
      // }),
      new LineLayer({
        id: this.id,
        data: data.data.edges,
        pickable: true,
        getWidth: 10,
        getSourcePosition: d => d.from.coordinates,
        getTargetPosition: d => d.to.coordinates,
        getColor: d => [255, 140, 0]
      })
    ];
  }
}
