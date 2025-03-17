///////////////////////////////////////// Défilement image dans détail ///////////////////////////////////

let currentImageIndex = 0;
const images = document.querySelectorAll('.image-carousel img');

function showImage(index) {
    images.forEach(img => img.classList.add('hidden'));
    images[index].classList.remove('hidden');
}

function changeImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex >= images.length) currentImageIndex = 0;
    if (currentImageIndex < 0) currentImageIndex = images.length - 1;
    showImage(currentImageIndex);
}

if (images.length > 0) {
    showImage(0);
}
