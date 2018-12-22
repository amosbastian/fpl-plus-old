import '../css/main.scss';
import {
  getPlayers, getTeamToFixtures, getTeams, getLocalUser,
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

/**
 * Returns the FDR element showing each player's FDR over the next 5 games.
 * @param {Array<Object>} fixtures
 */
function getFDRElement(fixtures) {
  let FDRSquares = '';
  fixtures.forEach((fixture) => {
    const FDRTitle = `${fixture.opponent_short_name} (${fixture.is_home ? 'H' : 'A'})`;
    FDRSquares += `<div class="fixture-square-table fdr--${fixture.difficulty}" title="${FDRTitle}"></div>`;
  });
  return `
    <div class="fdr-table">
      ${FDRSquares}
    </div>
  `;
}

/**
 * Returns the player row div.
 * @param {Object} player
 * @param {number} position
 * @param {boolean} myTeam
 */
function getPlayerRow(player, position, teamOverview) {
  const teamName = allTeams.find(team => team.id === player.team).short_name;
  const fixtures = teamToFixtures[teamName];
  const FDRElement = getFDRElement(fixtures);
  const fixtureTitle = `${fixtures[0].opponent_short_name} (${fixtures[0].is_home ? 'H' : 'A'})`;

  const className = (position <= 10) ? 'starter' : 'bench';
  const pointValue = (teamOverview) ? player.ep_this : player.event_points;

  return `
    <div class="fpl-team-table-row fpl-team-table-row--${className}">
      <div>${teamName}</div>
      <div>${player.web_name}</div>
      <div>${fixtureTitle}</div>
      ${FDRElement}
      <div class="fpl-team-table-points">${pointValue}</div>
    <div>
  `;
}

/**
 * Add player rows to the table.
 * @param {boolean} myTeam
 */
async function addPlayerRows(teamOverview = true) {
  const user = await getLocalUser();
  const [...picks] = user.picks.picks;
  const playerIds = picks.map(player => player.element);
  if (allPlayers.length === 0) {
    allPlayers = await getPlayers();
  }
  const players = allPlayers.filter(player => playerIds.includes(player.id));
  const tableId = `team-table${teamOverview ? '-points' : ''}`;
  const playerTable = document.getElementById(tableId);

  players
    .sort((a, b) => (playerIds.indexOf(a.id) > playerIds.indexOf(b.id) ? 1 : -1))
    .forEach((player) => {
      const playerRow = getPlayerRow(player, playerIds.indexOf(player.id), teamOverview);
      playerTable.insertAdjacentHTML('beforeend', playerRow);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  addPlayerRows(false);
  addPlayerRows(true);
});
