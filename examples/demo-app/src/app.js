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

import React, {Component} from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled, {ThemeProvider} from 'styled-components';
import window from 'global/window';
import {connect} from 'react-redux';

import {theme} from 'kepler.gl/styles';
import Banner from './components/banner';
import Announcement, {FormLink} from './components/announcement';
import {replaceLoadDataModal} from './factories/load-data-modal';
import {replaceMapControl} from './factories/map-control';
import {replacePanelHeader} from './factories/panel-header';
import {AUTH_TOKENS} from './constants/default-settings';
import {messages} from './constants/localization';
import {processGraph, processRowObject} from '../../../src/processors/data-processor';
import KeplerGlSchema from 'kepler.gl/schemas';

import {
  loadRemoteMap,
  loadSampleConfigurations,
  onExportFileSuccess,
  onLoadCloudMapSuccess
} from './actions';

import {loadCloudMap, addDataToMap, addNotification} from 'kepler.gl/actions';
import {CLOUD_PROVIDERS} from './cloud-providers';

const KeplerGl = require('kepler.gl/components').injectComponents([
  replaceLoadDataModal(),
  replaceMapControl(),
  replacePanelHeader()
]);

// Sample data
/* eslint-disable no-unused-vars */
import sampleTripData, {testCsvData, sampleTripDataConfig} from './data/sample-trip-data';
import sampleJsonGraph from './data/sample-json-graph';
import sampleGeojson from './data/sample-small-geojson';
import sampleGeojsonPoints from './data/sample-geojson-points';
import sampleGeojsonConfig from './data/sample-geojson-config';
import sampleH3Data, {config as h3MapConfig} from './data/sample-hex-id-csv';
import sampleS2Data, {config as s2MapConfig, dataId as s2DataId} from './data/sample-s2-data';
import sampleAnimateTrip from './data/sample-animate-trip-data';
import sampleIconCsv, {config as savedMapConfig} from './data/sample-icon-csv';

import {processCsvData, processGeojson} from 'kepler.gl/processors';

const BannerHeight = 48;
const BannerKey = `banner-${FormLink}`;
const keplerGlGetState = state => state.demo.keplerGl;

const GlobalStyle = styled.div`
  font-family: ff-clan-web-pro, 'Helvetica Neue', Helvetica, sans-serif;
  font-weight: 400;
  font-size: 0.875em;
  line-height: 1.71429;

  *,
  *:before,
  *:after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.labelColor};
  }
`;

class App extends Component {
  state = {
    showBanner: false,
    width: window.innerWidth,
    height: window.innerHeight
  };

  componentDidMount() {
    // if we pass an id as part of the url
    // we ry to fetch along map configurations
    const {params: {id, provider} = {}, location: {query = {}} = {}} = this.props;

    const cloudProvider = CLOUD_PROVIDERS.find(c => c.name === provider);
    if (cloudProvider) {
      this.props.dispatch(
        loadCloudMap({
          loadParams: query,
          provider: cloudProvider,
          onSuccess: onLoadCloudMapSuccess
        })
      );
      return;
    }

    // Load sample using its id
    if (id) {
      this.props.dispatch(loadSampleConfigurations(id));
    }

    // Load map using a custom
    if (query.mapUrl) {
      // TODO?: validate map url
      this.props.dispatch(loadRemoteMap({dataUrl: query.mapUrl}));
    }

    // load sample data
    this._loadSampleData();
  }

  getMapConfig() {
    // retrieve kepler.gl store
    const {demo} = this.props;
    // retrieve current kepler.gl instance store
    const {map} = demo.keplerGl;

    // create the config object
    return KeplerGlSchema.getConfigToSave(map);
  }

  _loadSampleData() {
    // this._loadPointData();
    // this._loadGeojsonData();
    // this._loadTripGeoJson();
    // this._loadGraphLayer();
    // this._loadIconData();
    // this._loadH3HexagonData();
    // this._loadH3HData();
    // this._loadS2Data();
    // this._loadScenegraphLayer();
    // this._loadBelAQI();
    // Notifications
    // this._loadMockNotifications();
    // this._addWMSLayer();
    this._loadBitmapLayer();
  }

  _loadBitmapLayer() {
    const data = require('../floodcast-data/data.json');

    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              label: 'Floodcast',
              id: 'floodcast-id'
            },
            data: processRowObject(data)
          }
        ],
        options: {
          keepExistingConfig: true,
          autoCreateLayers: false
        },
        config: {
          version: 'v1',
          config: {
            visState: {
              layers: [
                {
                  type: 'floatbitmap',
                  config: {
                    dataId: 'floodcast-id',
                    label: 'bitmap layer',
                    isVisible: true,
                    visConfig: {
                      colorRange: {
                        name: 'BelAQI (PM2.5)',
                        type: 'standard',
                        category: 'BelAQI',
                        ranges: [0, 0.1, 0.2, 0.25, 0.35, 0.4, 0.5, 0.6, 0.7, 1.5],
                        colors: [
                          '#1c00ff00',
                          '#3599ff',
                          '#2b9900',
                          '#4dff01',
                          '#fdff00',
                          '#f9bb02',
                          '#f66600',
                          '#f50b00',
                          '#990400',
                          '#660200'
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      })
    );
  }

  async _loadH3HData() {
    const data = await fetch(
      'https://cdne-cities-assets.azureedge.net/urbanage/hex_gent_8.json'
    ).then(res => res.json());
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              label: 'H3 Hexagons V2',
              id: 'h3-hex-id'
            },
            data: processRowObject(data)
          }
        ],
        options: {
          keepExistingConfig: true
        }
      })
    );
  }

  // _loadBelAQI = () => {
  //   this.props.dispatch(
  //     addDataToMap({
  //       datasets: [
  //         {
  //           info: {
  //             id: 'belaqi-layer',
  //             label: 'test-belaqi'
  //           },
  //           data: processGeojson(mockGeoJson)
  //         }
  //       ],
  //       config: {
  //         keepExistingConfig: true,
  //         version: 'v1',
  //         config: {
  //           visState: {
  //             layers: [
  //               {
  //                 type: 'geojson',
  //                 config: {
  //                   dataId: 'belaqi-layer',
  //                   columns: {
  //                     geojson: '_geojson'
  //                   },
  //                   isVisible: true,
  //                   visConfig: {
  //                     colorRange: {
  //                       name: 'BelAQI (PM2.5)',
  //                       type: 'standard',
  //                       category: 'BelAQI',
  //                       ranges: [5, 10, 15, 25, 35, 40, 50, 60, 70, 999],
  //                       colors: [
  //                         '#1c00ff',
  //                         '#3599ff',
  //                         '#2b9900',
  //                         '#4dff01',
  //                         '#fdff00',
  //                         '#f9bb02',
  //                         '#f66600',
  //                         '#f50b00',
  //                         '#990400',
  //                         '#660200'
  //                       ],
  //                       reversed: false
  //                     },
  //                     stroked: false
  //                   }
  //                 },
  //                 visualChannels: {
  //                   colorField: {
  //                     name: 'value',
  //                     type: 'real'
  //                   },
  //                   colorScale: 'threshold'
  //                 }
  //               }
  //             ]
  //           }
  //         }
  //       }
  //     })
  //   );
  // };

  _addWMSLayer = () => {
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              id: `wms-layer-1`,
              label: `WMS Layer`
            },
            data: processRowObject([
              {
                url:
                  'https://api.dev.precinct.odt.imec-apt.be/geoserver/Cityflows/wms?layers=Cityflows%3Astreets_daily_profiles&time=1970-01-01T09:00:00.000Z&CQL_FILTER=profile_type+=+%27FRIDAY%27',
                crs: 'EPSG:4326',
                styles: 'Cityflows:cityflows-profile'
              }
            ])
          }
        ],
        config: {
          keepExistingConfig: true,
          version: 'v1',
          config: {
            visState: {
              layers: [
                {
                  label: 'wms layer',
                  type: 'wms',
                  config: {
                    dataId: 'wms-layer-1',
                    isVisible: true
                  }
                }
              ]
            }
          }
        }
      })
    );
  };

  _addTileLayer = () => {
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              id: `tile-layer-1`,
              label: `Tile Layer`
            },
            data: processRowObject([
              {
                url:
                  'http://localhost:8085/geoserver/gwc/service/wmts?layer=geoserver-imec:19_05_2022 10_30_00-01&style=&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}'
              }
            ])
          }
        ],
        config: {
          keepExistingConfig: true,
          config: {
            visState: {
              layers: [
                {
                  type: 'tile',
                  label: 'tile layer',
                  config: {
                    dataId: 'tile-layer-1',
                    isVisible: true
                  }
                }
              ]
            }
          }
        }
      })
    );
  };

  _loadGraphLayer() {
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              id: `graph-layer-1`,
              label: `Graph Layer`
            },
            data: processGraph(sampleJsonGraph)
          }
        ],
        config: {
          keepExistingConfig: true,
          version: 'v1',
          config: {
            visState: {
              layers: [
                {
                  type: 'graph',
                  config: {
                    dataId: 'graph-layer-1',
                    isVisible: true,
                    visConfig: {
                      colorRange: {
                        name: 'custom',
                        type: 'standard',
                        category: 'BelAQI',
                        ranges: [1, 2, 3, 4, 5],
                        colors: ['#83E980', '#FFFC58', '#FEC44E', '#FF8A3F', '#ff4545'],
                        reversed: false
                      },
                      strokeColor: [50, 50, 50],
                      opacity: 1
                    }
                  },
                  visualChannels: {
                    colorField: {name: 'newState', type: 'integer'},
                    colorScale: 'threshold'
                  }
                }
              ]
            }
          }
        }
      })
    );
  }

  _updateTileLayer(dataId, url) {
    const config = this.getMapConfig();
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              id: dataId,
              label: `WMTS Layer`
            },
            data: processRowObject([
              {
                url
              }
            ])
          }
        ],
        config
      })
    );
  }

  _showBanner = () => {
    this.setState({showBanner: true});
  };

  _hideBanner = () => {
    this.setState({showBanner: false});
  };

  _disableBanner = () => {
    this._hideBanner();
    window.localStorage.setItem(BannerKey, 'true');
  };

  _loadMockNotifications = () => {
    const notifications = [
      [{message: 'Welcome to Kepler.gl'}, 3000],
      [{message: 'Something is wrong', type: 'error'}, 1000],
      [{message: 'I am getting better', type: 'warning'}, 1000],
      [{message: 'Everything is fine', type: 'success'}, 1000]
    ];

    this._addNotifications(notifications);
  };

  _addNotifications(notifications) {
    if (notifications && notifications.length) {
      const [notification, timeout] = notifications[0];

      window.setTimeout(() => {
        this.props.dispatch(addNotification(notification));
        this._addNotifications(notifications.slice(1));
      }, timeout);
    }
  }

  _loadPointData() {
    this.props.dispatch(
      addDataToMap({
        datasets: {
          info: {
            label: 'Sample Taxi Trips in New York City',
            id: 'test_trip_data'
          },
          data: sampleTripData
        },
        options: {
          centerMap: true,
          readOnly: false
        },
        config: sampleTripDataConfig
      })
    );
  }

  _loadScenegraphLayer() {
    this.props.dispatch(
      addDataToMap({
        datasets: {
          info: {
            label: 'Sample Scenegraph Ducks',
            id: 'test_trip_data'
          },
          data: processCsvData(testCsvData)
        },
        config: {
          version: 'v1',
          config: {
            visState: {
              layers: [
                {
                  type: '3D',
                  config: {
                    dataId: 'test_trip_data',
                    columns: {
                      lat: 'gps_data.lat',
                      lng: 'gps_data.lng'
                    },
                    isVisible: true
                  }
                }
              ]
            }
          }
        }
      })
    );
  }

  _loadIconData() {
    // load icon data and config and process csv file
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              label: 'Icon Data',
              id: 'test_icon_data'
            },
            data: processCsvData(sampleIconCsv)
          }
        ]
      })
    );
  }

  _loadTripGeoJson() {
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {label: 'Trip animation'},
            data: processGeojson(sampleAnimateTrip)
          }
        ]
      })
    );
  }

  _loadGeojsonData() {
    // load geojson
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {label: 'Bart Stops Geo', id: 'bart-stops-geo'},
            data: processGeojson(sampleGeojsonPoints)
          },
          {
            info: {label: 'SF Zip Geo', id: 'sf-zip-geo'},
            data: processGeojson(sampleGeojson)
          }
        ],
        options: {
          keepExistingConfig: true
        },
        config: sampleGeojsonConfig
      })
    );
  }

  _loadH3HexagonData() {
    // load h3 hexagon
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              label: 'H3 Hexagons V2',
              id: 'h3-hex-id'
            },
            data: processCsvData(sampleH3Data)
          }
        ],
        config: h3MapConfig,
        options: {
          keepExistingConfig: true
        }
      })
    );
  }

  _loadS2Data() {
    // load s2
    this.props.dispatch(
      addDataToMap({
        datasets: [
          {
            info: {
              label: 'S2 Data',
              id: s2DataId
            },
            data: processCsvData(sampleS2Data)
          }
        ],
        config: s2MapConfig,
        options: {
          keepExistingConfig: true
        }
      })
    );
  }

  _toggleCloudModal = () => {
    // TODO: this lives only in the demo hence we use the state for now
    // REFCOTOR using redux
    this.setState({
      cloudModalOpen: !this.state.cloudModalOpen
    });
  };

  _getMapboxRef = (mapbox, index) => {
    if (!mapbox) {
      // The ref has been unset.
      // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
      // console.log(`Map ${index} has closed`);
    } else {
      // We expect an InteractiveMap created by KeplerGl's MapContainer.
      // https://uber.github.io/react-map-gl/#/Documentation/api-reference/interactive-map
      const map = mapbox.getMap();
      map.on('zoomend', e => {
        // console.log(`Map ${index} zoom level: ${e.target.style.z}`);
      });
    }
  };

  render() {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle
          // this is to apply the same modal style as kepler.gl core
          // because styled-components doesn't always return a node
          // https://github.com/styled-components/styled-components/issues/617
          ref={node => {
            node ? (this.root = node) : null;
          }}
        >
          <Banner
            show={this.state.showBanner}
            height={BannerHeight}
            bgColor="#2E7CF6"
            onClose={this._hideBanner}
          >
            <Announcement onDisable={this._disableBanner} />
          </Banner>
          <div
            style={{
              transition: 'margin 1s, height 1s',
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: 0,
              top: 0
            }}
          >
            <AutoSizer>
              {({height, width}) => (
                <KeplerGl
                  mapboxApiAccessToken={AUTH_TOKENS.MAPBOX_TOKEN}
                  id="map"
                  /*
                   * Specify path to keplerGl state, because it is not mount at the root
                   */
                  getState={keplerGlGetState}
                  width={width}
                  height={height}
                  cloudProviders={CLOUD_PROVIDERS}
                  localeMessages={messages}
                  onExportToCloudSuccess={onExportFileSuccess}
                  onLoadCloudMapSuccess={onLoadCloudMapSuccess}
                />
              )}
            </AutoSizer>
          </div>
        </GlobalStyle>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
