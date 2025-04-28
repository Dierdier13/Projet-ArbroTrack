////////////////////////////////////////////// Leaflet /////////////////////////////////////////////////////

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const propertiesLayer = L.layerGroup().addTo(map);

function centerMapAutomatically(map) {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 13);

                L.marker([lat, lng]).addTo(map)
                    .bindPopup("Vous êtes ici.").openPopup();
            },
            (error) => {
                console.warn('Erreur de géolocalisation:', error.message);

                map.setView([46.615549, 2.455384], 5);
                if (L.GeoIP && typeof L.GeoIP.centerMapOnPosition === 'function') {
                    setTimeout(() => {
                        L.GeoIP.centerMapOnPosition(map, 13);
                    }, 1000);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        console.warn('Géolocalisation non supportée.');
        map.setView([48.8566, 2.3522], 5);

        if (L.GeoIP && typeof L.GeoIP.centerMapOnPosition === 'function') {
            setTimeout(() => {
                L.GeoIP.centerMapOnPosition(map, 13);
            }, 1000);
        }
    }
}



function displayProperty(property) {
    if (!property.latitude || !property.longitude) {
        console.warn('Propriété sans coordonnées:', property.propertyName);
        return null;
    }

    try {
        const marker = L.marker([property.latitude, property.longitude])
            .bindPopup(`<b>${property.propertyName}</b><br>${property.adress}<br>${property.codePostal} ${property.city}
                <br><a href="/property/${ property.id }" class="text-blue-500 underline">Voir la Propriété</a>`);

        let polygon = null;
        if (property.polygon) {
            const polyData = typeof property.polygon === 'string' ?
                JSON.parse(property.polygon) :
                property.polygon;

            polygon = L.geoJSON(polyData, {
                style: { color: '#3388ff', fillOpacity: 0.2 }
            });
        }

        const group = L.featureGroup(polygon ? [marker, polygon] : [marker])
            .addTo(propertiesLayer);

        return group;
    } catch (e) {
        console.error('Erreur d\'affichage:', e);
        return null;
    }
}

function loadPropertiesAndFit() {
    fetch('/?format=json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            propertiesLayer.clearLayers();
            const allLayers = [];

            data.properties.forEach(p => {
                const group = displayProperty(p);
                if (group) allLayers.push(group);
            });

            if (allLayers.length) {
                const bounds = L.featureGroup(allLayers).getBounds();
                map.fitBounds(bounds);
            } else {
                centerMapAutomatically(map);
            }
        })
        .catch(error => console.error('Erreur:', error));
}

loadPropertiesAndFit();

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

        if (property.latitude && property.longitude) {
            const newLayer = displayProperty(property);
            if (newLayer) {
                map.setView([property.latitude, property.longitude], 16);

                newLayer.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        layer.openPopup();
                    }
                });

                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        }

    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    }
});