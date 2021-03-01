var tileSize,
  everyOther = true,
  drawElev = false;

L.mapbox.accessToken = 'pk.eyJ1IjoiZG5vbWFkYiIsImEiOiJjaW16aXFsZzUwNHJmdjdra3h0Nmd2cjY1In0.SqzkaKalXxQaPhQLjodQcQ';

var map = L.map('map', {
  worldCopyJump: true,
  doubleClickZoom: false,
  center: [38, -120],
  zoom: 13,
});

L.mapbox.styleLayer('mapbox://styles/mapbox/outdoors-v11').addTo(map);

var elevTiles = new L.TileLayer.Canvas({
  unloadInvisibleTiles: true,
  attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

L.hash(map);

elevTiles.on('tileunload', function (e) {
  //Send tile unload data to elevWorker to delete un-needed pixel data
  elevWorker.postMessage({ 'data': e.tile._tilePoint.id, 'type': 'tileunload' });
});

var elevWorker = new Worker('js/imagedata.js');

var tileContextsElev = {};

var elev_filter = parseFloat(new URL(location).searchParams.get('elev'));
if (isNaN(elev_filter)) elev_filter = 10;

elevWorker.postMessage({
  data: elev_filter,
  type: 'setfilter'
}
);

elevTiles.drawTile = function (canvas, tile, zoom) {
  tileSize = this.options.tileSize;

  var context = canvas.getContext('2d'),
    imageObj = new Image(),
    tileUID = '' + zoom + '/' + tile.x + '/' + tile.y;

  var drawContext = canvas.getContext('2d');

  // To access / delete elevTiles later
  tile.id = tileUID;

  tileContextsElev[tileUID] = drawContext;

  imageObj.onload = function () {
    // Draw Image Tile
    context.drawImage(imageObj, 0, 0);

    // Get Image Data
    var imageData = context.getImageData(0, 0, tileSize, tileSize);

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
    var dispData = tileContextsElev[response.data.data.tileUID].createImageData(tileSize, tileSize);
    dispData.data.set(response.data.data.array);
    tileContextsElev[response.data.data.tileUID].putImageData(dispData, 0, 0);
  }
}, false);

elevTiles.addTo(map);


map.touchZoom.disable();
map.doubleClickZoom.disable();


function formatElev(elev) {
  return Math.round(elev) + ' m';
}
function formatTemp(temp) {
  return Math.round(temp) + '° f';
}

L.easyButton('fa-water', function () {
  const url = new URL(location);
  const newHeight = window.prompt("New sea level in metres:", elev_filter);
  if (newHeight == null) return;
  url.searchParams.set('elev', newHeight);
  location = url;
}).addTo(map);
