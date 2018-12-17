import '../css/main.scss';
import {
  getLocalUser, getLocalFixtures, getCurrentGameweek, showPage,
} from './fpl';

function toTeam() {
  showPage('team-overview');
}

function toPoints() {
  showPage('points-overview');
}

function toLeagues() {
  showPage('leagues-overview');
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

  const globalLeague = user.leagues.classic.find(league => league.name === 'Overall');
  let rankChange = '<span class="icon-triangle-up movement movement--up"></span>';
  if (globalLeague.entry_movement === 'down') {
    rankChange = '<span class="icon-triangle-down movement movement--down"></span>';
  } else if (globalLeague.entry_movement === 'same') {
    rankChange = '<span><div class="icon-circle movement movement--same"></div></span>';
  }

  document.getElementById('username').textContent = username;
  document.getElementById('team-name').textContent = teamName;
  document.getElementById('gameweek-rank').textContent = gameweekRank;
  document.getElementById('gameweek-points').textContent = gameweekPoints;
  document.getElementById('overall-rank').innerHTML = `<div class="rank-change">${rankChange}<div>${overallRank}</div></div>`;
  document.getElementById('overall-points').textContent = overallPoints;
  document.getElementById('gameweek-deadline').textContent = `Gameweek deadline is ${gameweekDeadline}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const viewTeamButton = document.getElementById('view-team');
  viewTeamButton.addEventListener('click', toTeam);

  const viewPointsButton = document.getElementById('view-points');
  viewPointsButton.addEventListener('click', toPoints);

  const viewLeaguesButton = document.getElementById('view-leagues');
  viewLeaguesButton.addEventListener('click', toLeagues);

  addUserInformation();
});
