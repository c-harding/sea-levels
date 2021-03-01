importScripts('general-geo-utils.js');

// Tile Data Holder
const tileData = {};
const tileDataNDWI = {};

let color_filter;

//Listen for events
self.addEventListener('message', function (e) {
  // obect to hold various methods based on message to worker
  let edgeFind = {
    // If tile data was sent, add to data object
    tiledata: function (inTile) {
      const dataArray = new Float32Array(65536);
      for (var i = 0; i < inTile.array.length / 4; i++) {
        const tDataVal = -10000 + ((inTile.array[i * 4] * 256 * 256 + inTile.array[i * 4 + 1] * 256 + inTile.array[i * 4 + 2]) * 0.1);

        const alpha = tDataVal > color_filter ? 0 : 100;

        inTile.array[i * 4] = 10;
        inTile.array[i * 4 + 1] = 20;
        inTile.array[i * 4 + 2] = 200;
        inTile.array[i * 4 + 3] = alpha;

        dataArray[i] = tDataVal;
      }
      self.postMessage({
        'data': {
          'tileUID': inTile.tileUID,
          'array': inTile.array
        },
        'type': 'tiledata'
      },
        [inTile.array.buffer]
      );
      delete inTile.array;
      tileData[inTile.tileUID] = dataArray;
    },

    // If a tile unload event was sent, delete the corresponding data
    tileunload: function (tileUnloadID) {
      delete tileData[tileUnloadID];
    },

    setfilter: function (elev) {
      color_filter = elev;
    }
  }
  // Call function based on message, send data.
  edgeFind[e.data.type](e.data.data);


}, false);
