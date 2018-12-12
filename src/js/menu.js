import { updateData } from './background';

function toggleMenu() {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.classList.toggle('icon-menu');
  menuIcon.classList.toggle('icon-cross');

  const menu = document.getElementById('fpl-menu-list');
  menu.classList.toggle('menu-hidden');
}

function logout() {
  chrome.storage.local.set({ loggedIn: false }, () => {
    chrome.browserAction.setPopup({ popup: 'login.html' });
    window.location.href = 'login.html';
  });
}

function refreshData() {
  updateData();
  toggleMenu();
}

document.addEventListener('DOMContentLoaded', () => {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.addEventListener('click', toggleMenu);

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', logout);

  const refreshDataButton = document.getElementById('refresh-data');
  refreshDataButton.addEventListener('click', refreshData);
});
