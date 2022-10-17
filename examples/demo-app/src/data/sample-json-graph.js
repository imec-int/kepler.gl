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
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/power-plant.png'
        }
      },
      {
        id: '2',
        label: 'Water pump (Aquafin Antwerp-South)',
        metadata: {
          x: 4.36955582033667,
          y: 51.19878530037734,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/water-pump.png'
        }
      },
      {
        id: '3',
        label: 'Kennedytunnel',
        metadata: {
          x: 4.371651627317661,
          y: 51.205651742412726,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/tunnel.png'
        }
      },
      {
        id: '4',
        label: 'Hospital (GZA Hospitals campus Sint-Vincentius)',
        metadata: {
          x: 4.422055727014319,
          y: 51.21352710975356,
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/hospital.png'
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
