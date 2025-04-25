/////////////////////////////// Toast ////////////////////////////////
function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

function initToasts() {
    const toasts = document.querySelectorAll('[id^="toast-"]');
    toasts.forEach(toast => {
        const progressBar = toast.querySelector('.toast-progress');
        const duration = 5000;

        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '100%';

        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 10);

        setTimeout(() => {
            closeToast(toast.id);
        }, duration);
    });
}

document.addEventListener('DOMContentLoaded', initToasts);


////////////////////////////////// Bouton retour ///////////////////////////////

// document.addEventListener('DOMContentLoaded', function () {
//     const boutonRetour = document.getElementById('bouton-retour');
//     if (boutonRetour) {
//         boutonRetour.addEventListener('click', function (e) {
//             e.preventDefault();
//             window.history.back();
//         });
//     }
// });

/////////////////////////////////// Drag and Drop Sortable ////////////////////////////

// document.addEventListener('DOMContentLoaded', function () {
//     const containers = document.querySelectorAll('.sortable-container');
//     if (containers) {
//         containers.forEach((container, index) => {
//             const containerId = container.id || `container-${index}`;

//             const savedOrder = JSON.parse(localStorage.getItem(`${containerId}Order`)) || [];

//             if (savedOrder.length > 0) {
//                 savedOrder.forEach(id => {
//                     const article = container.querySelector(`[data-id="${id}"]`);
//                     if (article) {
//                         container.appendChild(article);
//                     }
//                 });
//             }

//             new Sortable(container, {
//                 animation: 150,
//                 group: containerId,
//                 onEnd: () => {
//                     const newOrder = Array.from(container.children).map(el => el.dataset.id);
//                     localStorage.setItem(`${containerId}Order`, JSON.stringify(newOrder));
//                     console.log(`Nouvel ordre sauvegardé pour ${containerId}:`, newOrder);
//                 }
//             });
//         });
//     }
// });
