import '../css/main.scss';
import {
  getUser, getUserPicks, getUserHistory, getCurrentGameweek, getLocalUser, getPlayers,
  getTeamToFixtures, getTeams,
} from './fpl';

let allPlayers = [];
async function loadPlayers() {
  allPlayers = await getPlayers();
}
loadPlayers();

let teamToFixtures = [];
async function loadTeamToFixtures() {
  teamToFixtures = await getTeamToFixtures();
}
loadTeamToFixtures();

let allTeams = [];
async function loadTeams() {
  allTeams = await getTeams();
}
loadTeams();

document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.getElementsByTagName('a'));
  links.forEach((link) => {
    const location = link.href;
    link.onclick = () => chrome.tabs.create({ active: true, url: location });
  });
});

/**
 * Update the welcome page with the user's information.
 */
async function updateWelcomePage() {
  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'grid';

  const user = await getLocalUser();
  document.getElementById('username').textContent = `${user.entry.player_first_name}
    ${user.entry.player_last_name}`;
  document.getElementById('team-name').textContent = user.entry.name;
  document.getElementById('overall-points').textContent = user.entry.summary_overall_points;
  document.getElementById('overall-rank').textContent = user.entry.summary_overall_rank;
  document.getElementById('gameweek-points').textContent = user.entry.summary_event_points;
  document.getElementById('gameweek-rank').textContent = user.entry.summary_event_rank;
}

/**
 * Returns the fixture element shown in the player table.
 * @param {Array<Object>} fixtures
 */
function getFixtureElements(fixtures) {
  let fixtureElements = '';
  fixtures.forEach((fixture) => {
    const fixtureTitle = `${fixture.opponent_short_name} (${fixture.is_home ? 'H' : 'A'})`;
    const fixtureElement = `<div class="fixture-square fixture-square--small fdr--${fixture.difficulty}" title="${fixtureTitle}"></div>`;
    fixtureElements += fixtureElement;
  });
  return fixtureElements;
}

/**
 * Returns the player row div.
 * @param {Object} player
 * @param {number} position
 * @param {boolean} myTeam
 */
function createPlayerRow(player, position, myTeam) {
  const teamName = allTeams.find(team => team.id === player.team).short_name;
  const fixtures = teamToFixtures[teamName];
  const fixtureElements = getFixtureElements(fixtures);
  const fixtureTitle = `${fixtures[0].opponent_short_name} (${fixtures[0].is_home ? 'H' : 'A'})`;

  const className = (position <= 11) ? 'starter' : 'bench';
  const pointValue = (myTeam) ? player.ep_this : player.event_points;

  return `
    <div class="player-row player-row--${className}">
      <div class="player-cell">${teamName}</div>
      <div class="player-cell">${player.web_name}</div>
      <div class="player-cell player-table-next-fixture">${fixtureTitle}</div>
      <div class="player-table-fixtures">${fixtureElements}</div>
      <div class="player-cell player-table-expected-points">${pointValue}</div>
    <div>
  `;
}

/**
 * Add player rows to the myTeam popup page.
 * @param {boolean} myTeam
 */
async function addPlayerRows(myTeam = true) {
  const user = await getLocalUser();
  const [...picks] = user.picks.picks;
  const playerIds = picks.map(player => player.element);
  const players = allPlayers.filter(player => playerIds.includes(player.id));
  const playerTable = myTeam ? document.getElementById('myteam-table') : document.getElementById('points-table');

  players
    .sort((a, b) => (playerIds.indexOf(a.id) > playerIds.indexOf(b.id) ? 1 : -1))
    .forEach((player) => {
      const playerRow = createPlayerRow(player, playerIds.indexOf(player.id), myTeam);
      playerTable.insertAdjacentHTML('beforeend', playerRow);
    });
}

/**
 * Show the myTeam page.
 */
function showMyTeamPage() {
  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'none';

  const pointsPage = document.getElementById('points');
  pointsPage.style.display = 'none';

  const myTeamPage = document.getElementById('my-team');
  myTeamPage.style.display = 'grid';

  if (Array.from(document.getElementById('my-team').getElementsByClassName('player-row')).length <= 1) {
    addPlayerRows();
  }
}

/**
 * Show the points page.
 */
function showPointsPage() {
  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'none';

  const pointsPage = document.getElementById('points');
  pointsPage.style.display = 'grid';

  if (Array.from(document.getElementById('points').getElementsByClassName('player-row')).length <= 1) {
    addPlayerRows(false);
  }
}

/**
 * Shows the index page.
 */
function showWelcomePage() {
  const loginDiv = document.getElementById('login');
  loginDiv.style.display = 'none';

  const myTeamPage = document.getElementById('my-team');
  myTeamPage.style.display = 'none';

  const pointsPage = document.getElementById('points');
  pointsPage.style.display = 'none';

  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'grid';

  updateWelcomePage();
}

/**
 * Logs in the user by using their user ID.
 */
async function login() {
  const userId = document.getElementById('fpl-user-id').value;
  const currentGameweek = await getCurrentGameweek();
  const user = await getUser(userId);
  const picks = await getUserPicks(userId, currentGameweek);
  const history = await getUserHistory(userId);

  user.picks = picks;
  user.history = history;

  chrome.storage.local.set({ user });
  chrome.storage.local.set({ loggedIn: true });

  showWelcomePage();
}

/**
 * Removes the user from localStorage.
 */
async function logout() {
  const welcomePage = document.getElementById('welcome');
  const myTeamPage = document.getElementById('my-team');
  const pointsPage = document.getElementById('points');
  const loginDiv = document.getElementById('login');

  chrome.storage.local.set({ loggedIn: false }, () => {
    welcomePage.style.display = 'none';
    myTeamPage.style.display = 'none';
    pointsPage.style.display = 'none';
    loginDiv.style.display = 'grid';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.browserAction.setPopup({ popup: 'index.html' });
});
