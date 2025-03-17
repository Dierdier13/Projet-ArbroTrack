/////////////////////////// Modal ///////////////////

function openModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
    document.getElementById(modalId).classList.add("flex");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("flex");
    document.getElementById(modalId).classList.add("hidden");
}

/////////////////////////// Modal addTree ///////////////////////////////////

function openAddTreeModal(returnUrl, sectorId = null) {
    document.getElementById('returnUrl').value = returnUrl;
    document.getElementById('initialSectorId').value = sectorId || '';
    if (sectorId) {
        document.getElementById('sectorId').value = sectorId;
    } else {
        document.getElementById('sectorId').value = '';
    }
    document.getElementById('treeModal').classList.remove('hidden');
    document.getElementById('treeModal').classList.add("flex");
}

/////////////////////////// Modal pour récupérer ID à la suppression ///////////////////

function openDeleteModal(modalId, triggerElement) {
    const modal = document.getElementById(modalId);
    const id = triggerElement.getAttribute('data-id');
    const name = triggerElement.getAttribute('data-name');

    const types = ['property', 'sector', 'tree', 'history', 'comment'];
    
    types.forEach(type => {
        const nameElement = document.getElementById(`${type}Name`);
        const deleteElement = document.getElementById(`delete${type.charAt(0).toUpperCase() + type.slice(1)}`);
        
        if (nameElement) {
            nameElement.textContent = name;
        }
        if (deleteElement) {
            deleteElement.setAttribute('href', `/delete${type.charAt(0).toUpperCase() + type.slice(1)}/${id}`);
        }
    });

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

/////////////////////////// Modal pour récupérer ID à la Modification ///////////////////

async function openEditPropertyModal(propertyId) {
    try {
        const response = await fetch(`/editProperty/${propertyId}`);

        if (!response.ok) throw new Error('Erreur lors de la récupération des données de la propriété');
        const property = await response.json();

        const modal = document.getElementById('editPropertyModal');
        const form = modal.querySelector('form');

        form.elements['propertyId'].value = property.id;
        form.elements['name'].value = property.name;
        form.elements['adress'].value = property.adress;
        form.elements['codePostal'].value = property.codePostal;
        form.elements['city'].value = property.city;

        form.action = `/editProperty/${propertyId}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function openEditSectorModal(sectorId) {
    try {
        const response = await fetch(`/editSector/${sectorId}`);

        if (!response.ok) throw new Error('Erreur lors de la récupération des données du secteur');
        const sector = await response.json();

        const modal = document.getElementById('editSectorModal');
        const form = modal.querySelector('form');

        form.elements['sectorId'].value = sector.id;
        form.elements['name'].value = sector.name;
        form.elements['comment'].value = sector.comment;
        
        form.action = `/editSector/${sectorId}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function openEditTreeModal(propertyId ,treeId) {
    try {
        const response = await fetch(`/property/${propertyId}/editTree/${treeId}`);

        if (!response.ok) throw new Error("Erreur lors de la récupération des données de l'arbre");
        const tree = await response.json();

        const modal = document.getElementById('editTreeModal');
        const form = modal.querySelector('form');

        form.elements['treeId'].value = tree.id;
        form.elements['specy'].value = tree.specy;
        form.elements['height'].value = tree.height;
        form.elements['diameter'].value = tree.diameter;
        form.elements['healthStatut'].value = tree.healthStatut
        form.elements['sectorId'].value = tree.sectorId;
    
        form.action = `/property/${propertyId}/editTree/${treeId}`;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Erreur:', error);
    }
}