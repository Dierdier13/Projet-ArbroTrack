const sidebar = document.querySelector('.sidebar');
const mobileMenuToggle = document.querySelector('#mobile-menu-toggle');

mobileMenuToggle.addEventListener('click', toggleSidebar);

function toggleSidebar() {
  sidebar.classList.toggle('-translate-x-full');
  document.body.classList.toggle('sidebar-open');
}