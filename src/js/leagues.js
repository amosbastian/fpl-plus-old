import '../css/main.scss';

const leagueTriangles = Array.from(document.getElementsByClassName('icon-triangle-right leagues'));
const leagueTables = Array.from(document.getElementsByClassName('fpl-league-table-container'));

function back() {
  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

function showLeagueTable() {
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.remove('active');
    return;
  }

  leagueTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  leagueTables.forEach(leagueTable => leagueTable.classList.remove('active'));
  this.parentElement.nextElementSibling.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back');
  backButton.addEventListener('click', back);

  leagueTriangles.forEach(triangle => triangle.addEventListener('click', showLeagueTable));
});
