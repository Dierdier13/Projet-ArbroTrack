const mapElement = document.querySelector("#map-3");
const propertyId = parseInt(mapElement.getAttribute("data-propertyId"));
const sectorId = parseInt(mapElement.getAttribute("data-sectorId"))
const latitude = parseFloat(mapElement.getAttribute("data-lat"));
const longitude = parseFloat(mapElement.getAttribute("data-lon"));
const polygon = JSON.parse(mapElement.getAttribute("data-polygon"));

const customIcon = L.icon({
  iconUrl: '/assets/images/arbre.png',
  iconSize: [38, 48],
  iconAnchor: [22, 47],
  popupAnchor: [-3, -76]
});

let map; 

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
    map = L.map('map-3', {
        maxBounds: bounds,
        maxBoundsViscosity: 0.9,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false
    });
    map.fitBounds(bounds);
    map.setMinZoom(map.getZoom() -2);
    ajouterFondDeCarte(map);
    ajouterMarqueur(map, latitude, longitude);
    L.polygon(bounds, { color: 'green' }).addTo(map);
} else if (polygon.type === 'LineString') {
    const bounds = inverserCoordonnees(polygon.coordinates);
    map = L.map('map-3', {
        maxBounds: bounds,
        maxBoundsViscosity: 0.9,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false
    });
    map.fitBounds(bounds);
    map.setMinZoom(map.getZoom() -2);
    ajouterFondDeCarte(map);
    ajouterMarqueur(map, latitude, longitude);
    L.polygon(bounds, { color: 'green' }).addTo(map);
} else {
    const coordinates = inverserTableauSimple(polygon.coordinates);
    map = L.map('map-3', {
        maxBounds: L.latLngBounds(coordinates, coordinates),
        maxBoundsViscosity: 0.9,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false
    });
    map.setView(coordinates, 16);
    ajouterFondDeCarte(map);
    ajouterMarqueur(map, coordinates[0], coordinates[1]);
}

function loadPropertyTrees(propertyId) {
    fetch(`/property/${propertyId}/sector/${sectorId}/trees?format=json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau lors du chargement des arbres');
            }
            return response.json();
        })
        .then(trees => {
            trees.forEach(tree => {
                if (tree.latitude == null || tree.longitude == null) {
                    return;
                }
                const treeMarker = L.marker([tree.latitude, tree.longitude], { icon: customIcon }).addTo(map);
                treeMarker.bindPopup(`<b>${tree.specy}</b>
                  <br><a href="/property/${ propertyId }/tree/${ tree.id }" class="text-blue-500 underline">Voir détail de l'arbre</a>`);
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des arbres :', error);
        });
}

loadPropertyTrees(propertyId);
