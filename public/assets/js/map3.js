var latlngs =  [[43.301496, 5.573540],[43.301746, 5.574930],[43.301030, 5.575272],[43.300676, 5.573450]];
var latlngs2 = [[43.524058, 5.506702], [43.525199, 5.510850], [43.520135, 5.510233], [43.518254, 5.507100], [43.518727, 5.506637], [43.520929, 5.508888]];

var bounds = L.latLngBounds(latlngs.concat(latlngs2));

var map = L.map('map-3', {
    maxBounds: bounds, // Empêche de sortir des limites
    maxBoundsViscosity: 1.0, // Effet "mur" dur aux bords
    zoomControl: true, // Garde les contrôles de zoom visibles
    dragging: true,
    scrollWheelZoom: true, // Permet le zoom avec la molette
    doubleClickZoom: true
}).fitBounds(bounds);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, // Niveau maximum autorisé pour le zoom
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.polygon(latlngs, { color: 'green' }).addTo(map);
L.polygon(latlngs2, { color: 'blue' }).addTo(map);


map.setMinZoom(map.getBoundsZoom(bounds));