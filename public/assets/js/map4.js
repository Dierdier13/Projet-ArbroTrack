const mapElement = document.querySelector("#map-4");

const latitude = parseFloat(mapElement.getAttribute("data-lat"));
const longitude = parseFloat(mapElement.getAttribute("data-lon"));
const treeName = mapElement.getAttribute("data-name");
const sector = mapElement.getAttribute("data-sector");

const customIcon = L.icon({
    iconUrl: '/assets/images/arbre.png',
    iconSize: [38, 48],
    iconAnchor: [22, 47],
    popupAnchor: [-3, -76]
  });

const map = L.map('map-4', {
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: false
}).setView([latitude, longitude], 19);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
marker.bindPopup(`<strong>${treeName}</strong><br>Secteur : ${sector}`).openPopup();
