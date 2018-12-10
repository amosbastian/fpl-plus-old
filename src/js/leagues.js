import '../css/main.scss';

const triangles = Array.from(document.getElementsByClassName('icon-triangle-right'));

function back() {
  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

function showLeague() {
  triangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back');
  backButton.addEventListener('click', back);

  triangles.forEach(triangle => triangle.addEventListener('click', showLeague));
});
