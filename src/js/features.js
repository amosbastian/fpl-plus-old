import '../css/main.scss';

function toLogin() {
  chrome.browserAction.setPopup({ popup: 'login.html' });
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const featureButton = document.getElementById('fpl-feature-button');
  featureButton.addEventListener('click', toLogin);

  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.style.cursor = 'not-allowed';
});
