import { updateData } from './background';
import { showPage, getCurrentPage } from './fpl';

function toggleMenuStyle() {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.classList.toggle('icon-menu');
  menuIcon.classList.toggle('icon-cross');

  const menu = document.getElementById('fpl-menu-list');
  menu.classList.toggle('menu-hidden');
}

async function toggleMenu() {
  const currentPage = await getCurrentPage();
  if (currentPage === 'login-overview' || currentPage === 'features-overview') {
    return;
  }

  toggleMenuStyle();
}

function logout() {
  chrome.storage.local.set({ loggedIn: false }, () => {
    showPage('login-overview');
  });
  toggleMenuStyle();
}

function refreshData() {
  updateData();
  toggleMenu();
}

async function toFixtures() {
  const currentPage = await getCurrentPage();
  chrome.storage.local.set({ previousPage: currentPage });
  showPage('fixtures-overview');
  toggleMenuStyle();
}

async function toStatistics() {
  const currentPage = await getCurrentPage();
  chrome.storage.local.set({ previousPage: currentPage });
  showPage('statistics-overview');
  toggleMenuStyle();
}

document.addEventListener('DOMContentLoaded', () => {
  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.addEventListener('click', toggleMenu);

  const fixtures = document.getElementById('fixtures');
  fixtures.addEventListener('click', toFixtures);

  const statistics = document.getElementById('statistics');
  statistics.addEventListener('click', toStatistics);

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', logout);

  const refreshDataButton = document.getElementById('refresh-data');
  refreshDataButton.addEventListener('click', refreshData);
});
