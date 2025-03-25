const sidebar = document.querySelector('.sidebar');
const mobileMenuToggle = document.querySelector('#mobile-menu-toggle');
const menuIcon = document.querySelector('#menu-toggle');
const closeIcon = document.querySelector('#close-icon');

mobileMenuToggle.addEventListener('click', toggleSidebar);

function toggleSidebar() {
  sidebar.classList.toggle('-translate-x-full');
  document.body.classList.toggle('sidebar-open');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
}
