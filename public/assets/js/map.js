////////////////////////////////////////////// Leaflet /////////////////////////////////////////////////////

const map = L.map('map').setView([43.3010316, 5.57500490737489], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

const propertiesLayer = L.layerGroup().addTo(map);

function displayProperty(property) {
    if (!property.latitude || !property.longitude) {
        console.warn('Propriété sans coordonnées:', property.propertyName);
        return;
    }

    try {
        const marker = L.marker([property.latitude, property.longitude])
            .bindPopup(`<b>${property.propertyName}</b><br>${property.adress}</b><br>${property.codePostal} ${property.city}`);

        let polygon = null;
        if (property.polygon) {
            const polyData = typeof property.polygon === 'string' ?
                JSON.parse(property.polygon) :
                property.polygon;

            polygon = L.geoJSON(polyData, {
                style: { color: '#3388ff', fillOpacity: 0.2 }
            });
        }

        L.featureGroup(polygon ? [marker, polygon] : [marker])
            .addTo(propertiesLayer);
    } catch (e) {
        console.error('Erreur d\'affichage:', e);
    }
}


fetch('/?format=json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => { data.properties.forEach(displayProperty); })
    .catch(error => console.error('Erreur:', error));

document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch('/addProperty?api=true', {
            method: 'POST',
            body: new URLSearchParams(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur réseau');
        }

        const property = await response.json();

        document.getElementById('propertyModal').classList.add('hidden');

        if (property.coordinates) {
            displayProperty(property);
        }

        propertiesLayer.clearLayers();
        fetch('/?format=json')
            .then(response => response.json())
            .then(data => {
                propertiesLayer.clearLayers();
                data.properties.forEach(displayProperty);
            })

        window.location.href = '/';

    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    }
});

