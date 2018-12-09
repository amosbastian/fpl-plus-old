import '../css/main.scss';
import { getLocalUser, getLocalFixtures, getCurrentGameweek } from './fpl';

function toTeam() {
  chrome.browserAction.setPopup({ popup: 'team.html' });
  window.location.href = 'team.html';
}

function toPoints() {
  chrome.browserAction.setPopup({ popup: 'points.html' });
  window.location.href = 'points.html';
}

function toLeagues() {
  chrome.browserAction.setPopup({ popup: 'leagues_overview.html' });
  window.location.href = 'leagues_overview.html';
}

/**
 * Returns the deadline of the next gameweek.
 * @param {Array<object>} fixtures
 */
async function getGameweekDeadline(fixtures) {
  const currentGameweek = await getCurrentGameweek();
  const currentFixture = fixtures.find(fixture => fixture.event === currentGameweek + 1);
  return currentFixture.deadline_time_formatted;
}

/**
 * Adds all the user's information to the overview page.
 */
async function addUserInformation() {
  const user = await getLocalUser();
  const fixtures = await getLocalFixtures();
  const username = `${user.entry.player_first_name} ${user.entry.player_last_name}`;
  const teamName = user.entry.name;
  const gameweekRank = user.entry.summary_event_rank;
  const gameweekPoints = user.entry.summary_event_points;
  const overallRank = user.entry.summary_overall_rank;
  const overallPoints = user.entry.summary_overall_points;
  const gameweekDeadline = await getGameweekDeadline(fixtures);

  document.getElementById('username').textContent = username;
  document.getElementById('team-name').textContent = teamName;
  document.getElementById('gameweek-rank').textContent = gameweekRank;
  document.getElementById('gameweek-points').textContent = gameweekPoints;
  document.getElementById('overall-rank').textContent = overallRank;
  document.getElementById('overall-points').textContent = overallPoints;
  document.getElementById('gameweek-deadline').textContent = `Gameweek deadline is ${gameweekDeadline}`;
}

function openMenu() {
  this.classList.toggle('icon-menu');
  this.classList.toggle('icon-cross');

  const menu = document.getElementById('fpl-menu-list');
  menu.classList.toggle('menu-hidden');
}

function logout() {
  chrome.storage.local.set({ loggedIn: false }, () => {
    chrome.browserAction.setPopup({ popup: 'login.html' });
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const viewTeamButton = document.getElementById('view-team');
  viewTeamButton.addEventListener('click', toTeam);

  const viewPointsButton = document.getElementById('view-points');
  viewPointsButton.addEventListener('click', toPoints);

  const viewLeaguesButton = document.getElementById('view-leagues');
  viewLeaguesButton.addEventListener('click', toLeagues);

  const menuIcon = document.getElementById('fpl-menu');
  menuIcon.addEventListener('click', openMenu);

  const logoutButton = document.getElementById('logout');
  logoutButton.addEventListener('click', logout);

  addUserInformation();
});
