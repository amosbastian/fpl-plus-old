import '../css/main.scss';

function back() {
  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back');
  backButton.addEventListener('click', back);
});
