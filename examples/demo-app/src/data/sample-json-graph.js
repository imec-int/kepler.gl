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

export default {
  graph: {
    label: '8672f0ad-ce27-488a-b477-b64a4c57be41',
    type: 'simulation',
    nodes: [
      {
        id: '1',
        label: 'Power Plant (ENGIE Electrabel)',
        metadata: {
          x: 4.258873845576631,
          y: 51.32482250095482,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/power-plant.png',
          newState: 1
        }
      },
      {
        id: '2',
        label: 'Water pump (Aquafin Antwerp-South)',
        metadata: {
          x: 4.36955582033667,
          y: 51.19878530037734,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/water-pump.png',
          newState: 2
        }
      },
      {
        id: '3',
        label: 'Kennedytunnel',
        metadata: {
          x: 4.371651627317661,
          y: 51.205651742412726,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/tunnel.png',
          newState: 4
        }
      },
      {
        id: '4',
        label: 'Hospital (GZA Hospitals campus Sint-Vincentius)',
        metadata: {
          x: 4.422055727014319,
          y: 51.21352710975356,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/hospital.png',
          newState: 5
        }
      }
    ],
    edges: [
      {
        label: 'Power Plant (ENGIE Electrabel) - Water pump (Aquafin Antwerp-South)',
        source: '1',
        target: '2'
      },
      {
        label: 'Water pump (Aquafin Antwerp-South) - Kennedytunnel',
        source: '2',
        target: '3'
      },
      {
        label: 'Power Plant (ENGIE Electrabel) - Hospital (GZA Hospitals campus Sint-Vincentius)',
        source: '1',
        target: '4'
      }
    ],
    metadata: {
      project: 'PRECINCT'
    }
  }
};
