////////////////////////////////////////////// Leaflet /////////////////////////////////////////////////////

const polygon = document.querySelector("#map-2").getAttribute("data-polygon");
const lat = document.querySelector("#map-2").getAttribute("data-lat");
const lon = document.querySelector("#map-2").getAttribute("data-lon")
const jsonPolygon = JSON.parse(polygon);

console.log(lat);
console.log(lon);

const bounds = [[43.524058, 5.506702], [43.525199, 5.510850], [43.520135, 5.510233], [43.518254, 5.507100], [43.518727, 5.506637], [43.520929, 5.508888]];
console.log(jsonPolygon.coordinates[0]);

const map = L.map('map-2', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  dragging: true,
  scrollWheelZoom: true,
  doubleClickZoom: false
}).fitBounds(bounds);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
L.marker([lat, lon]).addTo(map);
L.polygon(bounds, { color: 'green' }).addTo(map);

map.setMinZoom(map.getZoom());


