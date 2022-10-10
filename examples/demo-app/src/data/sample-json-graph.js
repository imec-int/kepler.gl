export default {
  graph: {
    label: '8672f0ad-ce27-488a-b477-b64a4c57be41',
    type: 'simulation',
    nodes: [
      {
        id: '1',
        label: 'Power plant',
        metadata: {
          'is-a': ['room'],
          gis: [],
          x: 4.434661720198483,
          y: 51.20594386351399,
          'water-level-for-flooding-in-cm': [23],
          icon: 'https://cdne-cities-assets.azureedge.net/precinct/marker.png',
          event: 'flood',
          time: 0,
          oldState: 1,
          newState: 5,
          description: '"flood" at "Room 1". The state changed from "operational" to "outage".',
          newStateName: 'outage',
          oldStateName: 'operational'
        }
      },
      {
        id: '2',
        label: 'Water pump',
        metadata: {
          'is-a': ['room'],
          x: 4.413684631292414,
          y: 51.230266736445024,
          icon: 'https://stcitiespublic.blob.core.windows.net/assets/precinct/marker.png',
          event: 'flood',
          time: 1,
          originator: 1,
          oldState: 1,
          newState: 5,
          description:
            '"flood" at "Room 2". fire spread via "Room 1". The state changed from "operational" to "outage".',
          newStateName: 'outage',
          oldStateName: 'operational'
        }
      },
      {
        id: '3',
        label: 'Kennedy Tunnel',
        metadata: {
          'is-a': ['room'],
          x: 4.371651627317661,
          y: 51.205651742412726,
          icon: 'https://stcitiespublic.blob.core.windows.net/assets/precinct/marker.png',
          event: 'flood',
          time: 2,
          originator: 2,
          oldState: 1,
          newState: 5,
          description:
            '"flood" at "Room 3". fire spread via "Room 2". The state changed from "operational" to "majorly affected".',
          newStateName: 'outage',
          oldStateName: 'operational'
        }
      },
      {
        id: '4',
        label: 'Hospital',
        metadata: {
          'is-a': ['room'],
          x: 4.422055727014319,
          y: 51.21352710975356,
          icon: 'https://stcitiespublic.blob.core.windows.net/assets/precinct/marker.png',
          event: 'fire',
          time: 3,
          originator: 1,
          oldState: 1,
          newState: 5,
          description:
            '"flood" at "Room 4". fire spread via "Room 3". The state changed from "operational" to "majorly affected".',
          newStateName: 'outage',
          oldStateName: 'operational'
        }
      }
    ],
    edges: [
      {
        label: 'Power plant - Water pump',
        source: '1',
        target: '2'
      },
      {
        label: 'Water pump - Kennedy Tunnel',
        source: '2',
        target: '3'
      },
      {
        label: 'Power plant - Hospital',
        source: '1',
        target: '4'
      }
    ],
    metadata: {
      project: 'PRECINCT'
    }
  }
};
