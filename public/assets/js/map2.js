const mapElement = document.querySelector("#map-2");
const latitude = parseFloat(mapElement.getAttribute("data-lat"));
const longitude = parseFloat(mapElement.getAttribute("data-lon"));
const polygon = JSON.parse(mapElement.getAttribute("data-polygon"));

function inverserCoordonnees(tableau) {
  return tableau.map(coord => [coord[1], coord[0]]);
}
function inverserTableauSimple(tableau) {
  return [tableau[1], tableau[0]];
}

function ajouterFondDeCarte(map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

function ajouterMarqueur(map, lat, lon) {
  L.marker([lat, lon]).addTo(map);
}

if (polygon.type === 'Polygon') {
  const bounds = inverserCoordonnees(polygon.coordinates[0]);
  const map = L.map('map-2', { maxBounds: bounds, maxBoundsViscosity: 1.0, zoomControl: false, dragging: true, scrollWheelZoom: true, doubleClickZoom: false }).fitBounds(bounds);
  ajouterFondDeCarte(map);
  ajouterMarqueur(map, latitude, longitude);
  L.polygon(bounds, { color: 'green' }).addTo(map);
  map.setMinZoom(map.getZoom());
} else if (polygon.type === 'LineString') {
  const bounds = inverserCoordonnees(polygon.coordinates);
  const map = L.map('map-2', { maxBounds: bounds, maxBoundsViscosity: 1.0, zoomControl: false, dragging: true, scrollWheelZoom: true, doubleClickZoom: false }).fitBounds(bounds);
  ajouterFondDeCarte(map);
  ajouterMarqueur(map, latitude, longitude);
  L.polygon(bounds, { color: 'green' }).addTo(map);
  map.setMinZoom(map.getZoom());
} else {
  const coordinates = inverserTableauSimple(polygon.coordinates);
  const map = L.map('map-2', { maxBounds: L.latLngBounds(coordinates, coordinates), maxBoundsViscosity: 1.0, zoomControl: false, dragging: true, scrollWheelZoom: true, doubleClickZoom: false }).setView(coordinates, 16);
  ajouterFondDeCarte(map);
  ajouterMarqueur(map, coordinates[0], coordinates[1]);
}
