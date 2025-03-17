//////////////////////////////////// Affichage Toggle liste/article /////////////////////

document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('displayToggle');
    const listView = document.getElementById('listView');
    const articleView = document.getElementById('articleView');
    if (toggle) {
        toggle.addEventListener('change', function () {
            if (this.checked) {
                listView.classList.remove('hidden');
                articleView.classList.add('hidden');
            } else {
                listView.classList.add('hidden');
                articleView.classList.remove('hidden');
            }
        });
    }
});
