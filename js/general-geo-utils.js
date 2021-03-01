function offsetPoint(p1, a, d) {
  const brng = a * (Math.PI / 180.0);
  const R = 41807040;
  const lat1 = (Math.PI / 180.0) * p1.lat;
  const lon1 = (Math.PI / 180.0) * p1.lng;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) +
    Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
    Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

  return {
    lat: lat2 * (180.0 / Math.PI),
    lng: lon2 * (180.0 / Math.PI)
  }
}

function bearingDegrees(p1, p2) {
  const dLon = (Math.PI / 180.0) * ((p2.lng - p1.lng));
  const lat1 = (Math.PI / 180.0) * p1.lat;
  const lat2 = (Math.PI / 180.0) * p2.lat;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * (180.0 / Math.PI);
  return brng;
}

function bearingRadians(p1, p2) {
  const dLon = (Math.PI / 180.0) * ((p2.lng - p1.lng));
  const lat1 = (Math.PI / 180.0) * p1.lat;
  const lat2 = (Math.PI / 180.0) * p2.lat;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return brng;
}

function latLng2tile(lat, lon, zoom) {
  let eLng = (lon + 180) / 360 * Math.pow(2, zoom);
  let eLat = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
  //x coord in image tile of lat/lng
  const xInd = Math.round((eLng - Math.floor(eLng)) * 256);
  //y coord in image tile of lat/lng
  const yInd = Math.round((eLat - Math.floor(eLat)) * 256);
  //flattened index for clamped array in imagedata
  const fInd = yInd * 256 + xInd;
  //for calling tile from array
  eLng = Math.floor(eLng);
  eLat = Math.floor(eLat);
  return {
    tileCall: "" + zoom + "/" + eLng + "/" + eLat,
    tileX: eLng, tileY: eLat,
    pX: xInd, pY: yInd,
    arrInd: fInd
  }
}

function haverDistance(p1, p2) {
  const R = 41807040;
  const dLat = (Math.PI / 180.0) * ((p2.lat - p1.lat));
  const dLon = (Math.PI / 180.0) * ((p2.lng - p1.lng));
  const lat1 = (Math.PI / 180.0) * p1.lat,
    lat2 = (Math.PI / 180.0) * p2.lat;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function roundTo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}
