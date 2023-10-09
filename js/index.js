let tileSize,
  everyOther = true,
  drawElev = false;

L.mapbox.accessToken = 'pk.eyJ1IjoiY2hhcmRpbmciLCJhIjoiY2xuaW92eDQ0MTBuMzJqbWkxOHVzZmQ0eiJ9.l2vVQOXPJDh4xtVVh3ZYXw';

const map = L.map('map', {
  worldCopyJump: true,
  center: [38, -120],
  zoom: 13,
});

L.mapbox.styleLayer('mapbox://styles/mapbox/outdoors-v11').addTo(map);

const elevTiles = new L.TileLayer.Canvas({
  unloadInvisibleTiles: true,
  attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

L.hash(map);

elevTiles.on('tileunload', function (e) {
  //Send tile unload data to elevWorker to delete un-needed pixel data
  elevWorker.postMessage({ 'data': e.tile._tilePoint.id, 'type': 'tileunload' });
});

const elevWorker = new Worker('js/imagedata.js');

const tileContextsElev = {};

let elev_filter = parseFloat(new URL(location).searchParams.get('elev'));
if (isNaN(elev_filter)) elev_filter = 10;

elevWorker.postMessage({
  data: elev_filter,
  type: 'setfilter'
}
);

elevTiles.drawTile = function (canvas, tile, zoom) {
  tileSize = this.options.tileSize;

  const context = canvas.getContext('2d'),
    imageObj = new Image(),
    tileUID = '' + zoom + '/' + tile.x + '/' + tile.y;

  // To access / delete elevTiles later
  tile.id = tileUID;

  tileContextsElev[tileUID] = context;

  imageObj.onload = function () {
    // Draw Image Tile
    context.drawImage(imageObj, 0, 0);

    // Get Image Data
    const imageData = context.getImageData(0, 0, tileSize, tileSize);

    elevWorker.postMessage({
      data: {
        tileUID: tileUID,
        tileSize: tileSize,
        array: imageData.data,
        drawElev: drawElev
      },
      type: 'tiledata'
    },
      [imageData.data.buffer]);
  };

  // Source of image tile
  imageObj.crossOrigin = 'Anonymous';
  imageObj.src = 'https://a.tiles.mapbox.com/v4/mapbox.terrain-rgb/' + zoom + '/' + tile.x + '/' + tile.y + '.pngraw?access_token=' + L.mapbox.accessToken;

};

elevWorker.addEventListener('message', function (response) {
  if (response.data.type === 'tiledata') {
    const dispData = tileContextsElev[response.data.data.tileUID].createImageData(tileSize, tileSize);
    dispData.data.set(response.data.data.array);
    tileContextsElev[response.data.data.tileUID].putImageData(dispData, 0, 0);
  }
}, false);

elevTiles.addTo(map);

function formatElev(elev) {
  return Math.round(elev) + ' m';
}
function formatTemp(temp) {
  return Math.round(temp) + '° f';
}

L.easyButton({
  states: [
    {
      icon: 'fa-water',
      title: "Change sea level height",
      onClick() {
        const url = new URL(location);
        const newHeight = window.prompt("New sea level in metres:", elev_filter);
        if (newHeight == null) return;
        url.searchParams.set('elev', newHeight);
        location = url;
      }
    }
  ]
}).addTo(map);


L.easyButton({
  states: [
    {
      icon: 'fa-github fab',
      title: "GitHub",
      onClick() {
        window.open("https://www.github.com/c-harding/sea-levels/", '_blank');
      }
    }
  ]
}).addTo(map);
