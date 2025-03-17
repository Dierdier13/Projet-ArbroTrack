////////////////////////////////////////////// Leaflet /////////////////////////////////////////////////////

const polygon = document.querySelector("#map-2").getAttribute("data-polygon");
const latitude = document.querySelector("#map-2").getAttribute("data-lat");
const longitude = document.querySelector("#map-2").getAttribute("data-lon");
const codePostal = document.querySelector("#map-2").getAttribute("data-CP")
const jsonPolygon = JSON.parse(polygon);

function inverserCoordonnees(tableau) {
  return tableau.map(coord => [coord[1], coord[0]]);
}
function inverserTableauSimple(tableau) {
  return [tableau[1], tableau[0]];
}

function getDepartementFromCodePostal(codePostal) {
  const departement = String(codePostal).slice(0, 2);
  if (departement === "20") {
      return codePostal >= 20200 ? "2A" : "2B";
  } else if (["97", "98"].includes(departement)) {
      return String(codePostal).slice(0, 3);
  }
  return departement;
}

if (jsonPolygon.type == 'Polygon') {
  const bounds = inverserCoordonnees(jsonPolygon.coordinates[0]);

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
  L.marker([latitude, longitude]).addTo(map);
  L.polygon(bounds, { color: 'green' }).addTo(map);

  map.setMinZoom(map.getZoom());

} else if (jsonPolygon.type === 'LineString') {
  const bounds = inverserCoordonnees(jsonPolygon.coordinates);

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
  L.marker([latitude, longitude]).addTo(map);
  L.polygon(bounds, { color: 'green' }).addTo(map);

  map.setMinZoom(map.getZoom());

} else {
  const coordinates = inverserTableauSimple(jsonPolygon.coordinates);
  const departement = getDepartementFromCodePostal(codePostal);
  console.log(coordinates);
  console.log(departement);
  

  const bounds = L.latLngBounds(coordinates, coordinates);

  const map = L.map('map-2', {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0,
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: false
  }).setView(coordinates, departement);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  L.marker(coordinates).addTo(map);
}




