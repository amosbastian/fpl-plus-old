import '../css/main.scss';
import {
  getClassicLeagueCS, getCurrentGameweek, getPlayers, getTeams, getUser, getUserPicks,
  getUserHistory, leagueRegex, getTeamToFixtures, getLocalTeams, getLocalPlayers, getLiveData,
} from './fpl';

let teamToFixtures = [];
async function loadTeamToFixtures() {
  teamToFixtures = await getTeamToFixtures();
}
loadTeamToFixtures();

let allPlayers = [];
async function loadPlayers() {
  allPlayers = await getPlayers();
}
loadPlayers();

let allTeams = [];
async function loadTeams() {
  allTeams = await getTeams();
}
loadTeams();

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * My Team                                                                                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

/**
 * Returns a div containing a player's upcoming fixtures with their respective difficulty.
 * @param {Array} fixtures
 */
function getFixturesDiv(fixtures, transfers = false) {
  let fixtureElements = '';
  let className = transfers ? 'fixture-square fixture-square--small' : 'fixture-square';
  fixtures.forEach((fixture) => {
    const fixtureTitle = `${fixture.opponent_short_name} (${fixture.is_home ? 'H' : 'A'})`;
    const fixtureElement = `<div class="${className} fdr--${fixture.difficulty}" title="${fixtureTitle}"></div>`;
    fixtureElements += fixtureElement;
  });

  className = transfers ? 'transfer-fixtures' : 'player-fixtures';

  return `
  <div class="${className}">
    ${fixtureElements}
  </div>
  `;
}

/**
 * Returns an array of players that are in the user's current team.
 */
async function getTeamPlayers(transfers = false) {
  if (allTeams.length === 0) {
    allTeams = await getLocalTeams();
  }

  if (allPlayers.length === 0) {
    allPlayers = await getLocalPlayers();
  }

  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);
  const teamPlayers = playerElements.map((element) => {
    let isCaptain = false;
    let isViceCaptain = false;

    if (!transfers) {
      const captainDiv = element.nextElementSibling.querySelector('.ism-element__control--captain');

      if (captainDiv !== null) {
        isCaptain = captainDiv.querySelector('span').title === 'Captain';
        isViceCaptain = captainDiv.querySelector('span').title === 'Vice-captain';
      }
    }

    const playerName = element.querySelector('div > .ism-element__name').textContent;
    const teamName = element.querySelector('picture > img').getAttribute('alt');

    if (teamName === 'Click to select a replacement') {
      // TODO: make more robust.
      return allPlayers.find(player => player.web_name);
    }
    const teamId = allTeams.find(team => team.name === teamName).id;
    const foundPlayer = allPlayers
      .find(player => player.web_name === playerName && player.team === teamId);
    foundPlayer.is_captain = isCaptain;
    foundPlayer.is_vice_captain = isViceCaptain;

    return foundPlayer;
  });
  return teamPlayers;
}

/**
 * Adds a div containing the player's upcoming 5 fixtures under each player element in the team
 * section.
 */
async function addPlayerFixtures() {
  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);
  playerElements.forEach((div) => {
    const teamName = div.querySelector('picture > img').getAttribute('alt');
    if (teamName !== 'Click to select a replacement') {
      const fixtures = teamToFixtures[teamName];
      const fixturesDiv = getFixturesDiv(fixtures);
      div.insertAdjacentHTML('beforeend', fixturesDiv);
    }
  });
}

/**
 * Adds each player's expection points next to their next fixture.
 */
async function addPlayerExpectedPoints(transfers = false) {
  const teamPlayers = await getTeamPlayers(transfers);
  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);

  Array.from(playerElements).forEach((playerElement) => {
    let element = playerElement;
    if (!transfers) {
      element = playerElement.querySelector('div');
    }

    const playerName = element.querySelector('.ism-element__name').textContent;
    const nextFixture = element.querySelector('.ism-element__data');
    const player = teamPlayers.find(playerObject => playerObject.web_name === playerName);
    const expectedPoints = (typeof player === 'undefined') ? 0 : player.ep_this;

    const alreadyAdded = nextFixture.getElementsByClassName('ep-this');
    if (alreadyAdded.length === 0) {
      nextFixture.insertAdjacentHTML('beforeend',
        `<div title="Expected points" class="grid-center ep-this">${expectedPoints}</div>`);
    }
  });
}

/**
 * Returns a span with the icon showing the player's transfer change (in or out).
 * @param {Object} player
 */
function getTransferChangeIcon(player) {
  if (typeof player === 'undefined') {
    return ['0', '<span>0</span>'];
  }
  const totalPlayers = 59000;
  const transfersOut = player.transfers_out_event;
  const transfersIn = player.transfers_in_event;
  const transfers = (transfersIn > transfersOut) ? transfersIn : transfersOut;
  const selectedBy = player.selected_by_percent * totalPlayers;
  const percentageChange = transfers / selectedBy * 100;

  const className = (transfersIn > transfersOut) ? 'price-rising' : 'price-falling';
  const title = (transfersIn > transfersOut) ? `+${transfersIn}` : `-${transfersOut}`;
  const icon = (percentageChange > 7.5) ? 'icon-angle-double-up' : 'icon-angle-up';

  return [title, `<span class="${icon} transfer-icon ${className}"></span>`];
}

/**
 * Adds the transfer change icon to each player's element.
 * @param {boolean} transfers
 */
async function addPlayerTransferChange(transfers = false) {
  const teamPlayers = await getTeamPlayers(transfers);
  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);

  Array.from(playerElements).forEach((playerElement) => {
    let element = playerElement;
    if (!transfers) {
      element = playerElement.querySelector('div');
    }

    const nextFixture = element.querySelector('.ism-element__data');
    const alreadyAdded = nextFixture.getElementsByClassName('selected-by');

    if (alreadyAdded.length === 0) {
      const playerName = element.querySelector('.ism-element__name').textContent;
      const player = teamPlayers.find(playerObject => playerObject.web_name === playerName);
      const [title, icon] = getTransferChangeIcon(player);
      nextFixture.insertAdjacentHTML('afterbegin',
        `<div title="${title}" class="grid-center selected-by">${icon}</div>`);
    }
  });
}

/**
 * Creates the expected points header shown at the top of /team/my and /transfers.
 * @param {boolean} transfers
 */
function createExpectedPointsElement(transfers) {
  const mainSection = document.getElementsByTagName('section')[1];
  const mainClass = transfers ? 'expected-points expected-points--transfers' : 'expected-points';
  const mainHTML = `
    <div class="${mainClass}">
      <h3 class="expected-points--header">
        Expected points
      </h3>
      <div class="expected-points--value">
      </div>
    </div>
  `;
  mainSection.insertAdjacentHTML('beforebegin', mainHTML);

  return mainSection.getElementsByClassName('expected-points');
}

/**
 * Adds the player's expected points for the next gameweek to each player's element.
 * @param {boolean} transfers
 */
async function addTotalExpectedPoints(transfers = false) {
  if (!document.querySelector('.expected-points')) {
    createExpectedPointsElement(transfers);
  }

  const teamPlayers = await getTeamPlayers(transfers);
  const players = transfers ? teamPlayers : teamPlayers.slice(0, 11);
  const expectedPoints = players.reduce((points, player) => points + parseFloat(player.ep_this), 0);
  const element = document.getElementsByClassName('expected-points--value')[0];

  element.textContent = `${expectedPoints.toFixed(1)}`;
}

/**
 * Unrounds the bottom border of the player's next fixture.
 */
function updateFixtureStyle() {
  const nextFixtures = Array.from(document.getElementsByClassName('ism-element__data'));
  nextFixtures.forEach((fixture) => {
    fixture.style.borderBottomLeftRadius = 0;
    fixture.style.borderBottomRightRadius = 0;
  });
}

/**
 * Increases the bench's height so the bench numbers still show.
 */
function updateBenchStyle() {
  const bench = document.getElementsByClassName('ism-bench')[0];
  bench.style.minHeight = '18rem';

  const benchHeaders = Array.from(document.getElementsByClassName('ism-bench__heading'));
  benchHeaders.forEach((header) => {
    header.style.bottom = '-1.375rem';
  });
}

/**
 * Filters player's by their position:
 * 1: Goalkeeper
 * 2: Defender
 * 3: Midfielder
 * 4: Forward
 * @param {Object} players
 * @param {number} position
 */
function filterPlayersByPosition(players, position) {
  return players.filter(player => player.element_type === position);
}

/**
 * Converts arrays of players to strings used in RMT threads on Reddit, e.g.:
 *                        Patrício
 *               Robertson - Alonso - Duffy
 * Richarlison (C) - Mané - Sterling (V) - Hazard - Fraser
 *                    Jiménez - Wilson
 */
function getPositionStrings(goalkeeper, defenders, midfielders, forwards) {
  const positionStrings = [];
  [goalkeeper, defenders, midfielders, forwards].forEach((position) => {
    const positionString = [];
    position.forEach((player) => {
      let badge = '';
      if (player.is_captain) {
        badge = ' (C)';
      } else if (player.is_vice_captain) {
        badge = ' (V)';
      }
      positionString.push(`${player.web_name}${badge}`);
    });
    positionStrings.push(positionString.join(' - '));
  });
  return positionStrings;
}

/**
 * Returns the max width of the given position strings, which is used to center the players in the
 * getRMTString function.
 * @param {Array<string>} positionStrings
 */
function getMaxWidth(positionStrings) {
  return Math.max(...positionStrings.map(positionString => positionString.length));
}

/**
 * Returns the player's team converted to a string usable in RMT threads on Reddit.
 * @param {number} squadValue
 * @param {number} inTheBank
 * @param {number} freeTransfers
 */
async function getRMTString(squadValue, inTheBank, freeTransfers) {
  const teamPlayers = await getTeamPlayers();
  const starters = teamPlayers.slice(0, 11);
  const bench = teamPlayers.slice(11, 15);

  const goalkeeper = [starters[0]];
  const defenders = filterPlayersByPosition(starters, 2);
  const midfielders = filterPlayersByPosition(starters, 3);
  const forwards = filterPlayersByPosition(starters, 4);

  const positionStrings = getPositionStrings(goalkeeper, defenders, midfielders, forwards);
  const maxWidth = getMaxWidth(positionStrings);

  let RMT = '';
  positionStrings.forEach((positionString) => {
    const padding = maxWidth / 2 + positionString.length / 2 + 4;
    RMT += `${positionString.padStart(padding, ' ')}\n`;
  });
  RMT += `\n    Bench: ${bench[0].web_name} - ${bench.slice(1).map(player => player.web_name).join(', ')}\n`;
  RMT += `\n    SV:  £${squadValue}\n    ITB: £${inTheBank}\n    FTs: ${freeTransfers}`;

  return RMT;
}

/**
 * Copies RMT string top clipboard and updates alert.
 */
async function copyRMT() {
  const pointsURL = document.querySelector('.ism-nav__list__item > a[data-nav-tab="points"]').getAttribute('href');
  const userId = parseInt(/.*\/(\d+)\//.exec(pointsURL)[1], 10);
  const user = await getUser(userId);
  const alert = document.getElementsByClassName('ism-alert--info')[0];

  const squadValue = user.entry.value / 10;
  const inTheBank = user.entry.bank / 10;
  const freeTransfers = user.entry.event_transfers_cost < 0
    ? 0 : user.entry.extra_free_transfers + 1 - user.entry.event_transfers;

  const RMTString = await getRMTString(squadValue, inTheBank, freeTransfers);
  navigator.clipboard.writeText(RMTString);

  alert.className = 'ism-alert--success';
  alert.innerHTML = '<p class="ism-alert__item">Copied team to clipboard!</p>';
}

/**
 * Adds button for copying team for use in RMT threads on /r/FantasyPL.
 */
function addRedditButton() {
  const squadWrapper = document.getElementsByClassName('ism-squad-wrapper')[0];
  if (squadWrapper.firstChild.className === 'reddit-rmt grid-center') {
    return;
  }
  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'reddit-rmt grid-center';
  buttonDiv.title = 'Copy team for RMT thread!';
  buttonDiv.onclick = copyRMT;
  buttonDiv.innerHTML = '<span class="rmt-icon icon-reddit-square"></span>';

  squadWrapper.insertAdjacentElement('afterbegin', buttonDiv);
}

/**
 * Updates My Team's style to accomodate the changes.
 */
function updateMyTeamStyle() {
  updateFixtureStyle();
  updateBenchStyle();
}

const myTeamObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
        && (mutation.target.id === 'ismr-main' || mutation.target.id === 'ismr-summary-bench'
        || mutation.target.id === 'ismr-pos11')
        && document.URL === 'https://fantasy.premierleague.com/a/team/my') {
      updateMyTeamStyle();
      addPlayerFixtures();
      addPlayerExpectedPoints();
      addTotalExpectedPoints();
      addPlayerTransferChange();
      addRedditButton();
    }
  });
});
myTeamObserver.observe(document.getElementById('ismr-main'), {
  childList: true,
  subtree: true,
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Classic League                                                                                  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

/**
 * Returns the manager's ID.
 * @param {Node} row
 */
function getIdFromRow(row) {
  const rowData = row.getElementsByTagName('td');
  const managerURL = rowData[1].getElementsByTagName('a')[0].href;
  const managerId = managerURL.split('/').pop();
  return managerId;
}

/**
 * Returns a div containing the starting players or bench players depending on the given
 * `playerType`.
 * @param {Array<Object>} allPlayers
 * @param {Array<Object>} picks
 * @param {string} playerType
 */
function createPlayersDiv(picks, playerType) {
  const starterOrBench = (position) => {
    if (playerType === 'starter') {
      return position <= 11;
    }
    return position > 11;
  };
  const playerIds = picks.reduce((ids, player) => {
    if (starterOrBench(player.position)) {
      ids.push(player.element);
    }
    return ids;
  }, []);
  const players = allPlayers.filter(player => playerIds.includes(player.id));
  const playersDiv = document.createElement('div');
  const playersHeader = document.createElement('h5');
  const textAlignment = (playerType === 'starter') ? 'right' : 'left';

  if (playerType === 'starter') {
    playersHeader.textContent = 'Starters';
  } else {
    playersHeader.textContent = 'Bench';
  }

  playersDiv.className = `manager-team--${textAlignment}`;
  playersHeader.style.textAlign = textAlignment;
  playersDiv.appendChild(playersHeader);

  const captainId = picks.find(player => player.is_captain).element;
  const viceCaptainId = picks.find(player => player.is_vice_captain).element;

  // Sort players by position so it's GK -> DEF -> MID -> FWD.
  players
    .sort((a, b) => (playerIds.indexOf(a.id) > playerIds.indexOf(b.id) ? 1 : -1))
    .forEach((player) => {
      const playerText = document.createElement('p');
      playerText.style.textAlign = textAlignment;

      if (player.id === captainId) {
        playerText.textContent = `(C) ${player.web_name}`;
      } else if (player.id === viceCaptainId) {
        playerText.textContent = `(V) ${player.web_name}`;
      } else {
        playerText.textContent = player.web_name;
      }

      playersDiv.appendChild(playerText);
    });

  return playersDiv;
}

/**
 * Returns the div containing both the starting players and the bench players shown when the
 * "Show team" button is clicked.
 * @param {Array<Object>} picks
 */
function createTeamDiv(picks) {
  const teamDiv = document.createElement('div');
  teamDiv.className = 'manager-team';
  teamDiv.appendChild(createPlayersDiv(picks, 'starter'));
  teamDiv.appendChild(createPlayersDiv(picks, 'ben'));
  return teamDiv;
}

/**
 * Toggles the showing and hiding of each manager's team.
 */
async function toggleTeam() {
  const parentRow = this.parentElement.parentElement;
  const teamRow = parentRow.nextElementSibling;

  this.classList.toggle('button-toggle-team--active');
  teamRow.classList.toggle('manager-team-row--hidden');

  if (this.textContent === 'Hide team') {
    this.textContent = 'Show team';
  } else {
    this.textContent = 'Hide team';
  }
}

/**
 * Adds a row containing each manager's current team to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 * @param {Array<Object>} players
 */
function addTeamRow(leagueTable, managers, players) {
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const newRow = tableBody.insertRow(row.rowIndex);
    const newRowData = document.createElement('td');
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);
    const teamDiv = createTeamDiv(currentManager.picks.picks, players);

    newRowData.colSpan = `${row.getElementsByTagName('td').length}`;
    newRow.className = 'manager-team-row manager-team-row--hidden';
    newRowData.appendChild(teamDiv);
    newRow.appendChild(newRowData);
  });
}

/**
 * Adds a button that toggles each manager's team to the league table.
 * @param {Node} leagueTable
 */
function addToggleTeamButton(leagueTable) {
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const toggleTeamCell = row.insertCell(-1);
    const toggleTeamButton = document.createElement('div');

    toggleTeamCell.appendChild(toggleTeamButton);
    toggleTeamButton.className = 'button-toggle-team';
    toggleTeamButton.innerHTML = 'Show team';
    toggleTeamButton.addEventListener('click', toggleTeam);
  });
}

/**
 * Inserts a <th> in the table's head with the given content and title.
 * @param {Node} tableHead
 * @param {string} content
 * @param {string} title
 */
function insertTableHeader(tableHead, content, title) {
  const th = document.createElement('th');
  const spanHeader = document.createElement('span');

  spanHeader.className = 'ismjs-tooltip ismjs-tooltip--grouped ism-tooltip tooltipstered';
  spanHeader.textContent = content;
  spanHeader.title = title;

  th.appendChild(spanHeader);
  tableHead.appendChild(th);
}

/**
 * Returns the manager's captain.
 * @param {Array<Object>} picks
 * @param {Array<Object>} players
 */
function getCaptain(picks, players) {
  const captain = picks.find(player => player.is_captain);
  return players.find(player => player.id === captain.element);
}

/**
 * Returns the manager's vice captain.
 * @param {Array<Object>} picks
 * @param {Array<Object>} players
 */
function getViceCaptain(picks, players) {
  const captain = picks.find(player => player.is_vice_captain);
  return players.find(player => player.id === captain.element);
}

/**
 * Adds the manager's captain and vice captain to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 * @param {Array<Object>} players
 */
function addCaptains(leagueTable, managers, players) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'C', 'Captain');
  insertTableHeader(tableHead, 'V', 'Vice-captain');
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const captainCell = row.insertCell(-1);
    const viceCaptainCell = row.insertCell(-1);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    const captain = getCaptain(currentManager.picks.picks, players);
    const viceCaptain = getViceCaptain(currentManager.picks.picks, players);

    captainCell.textContent = `${captain.web_name}`;
    viceCaptainCell.textContent = `${viceCaptain.web_name}`;
  });
}

/**
 * Converts FPL chip name to more readable chip name.
 * @param {string} chipName
 */
function toChipString(chipName) {
  if (chipName === '3xc') {
    return 'TC';
  } if (chipName === 'freehit') {
    return 'FH';
  } if (chipName === 'bboost') {
    return 'BB';
  }
  return 'WC';
}

/**
 * Returns the chip that the manager has activated in the current gameweek.
 * @param {Array<Object>} chips
 * @param {number} currentGameweek
 */
function getActiveChip(chips, currentGameweek) {
  if (chips.length === 0) return 'None';

  const activeChip = chips.find(chip => chip.event === currentGameweek);
  if (typeof activeChip === 'undefined') return 'None';

  return toChipString(activeChip.name);
}

/**
 * Returns the manager's used chips (excluding the currently active chip).
 * @param {Array<Object>} chips
 * @param {number} currentGameweek
 */
function getUsedChips(chips, currentGameweek) {
  if (chips.length === 0) return 'None';

  return chips.reduce((usedChips, chip) => {
    if (chip.event !== currentGameweek) {
      usedChips.push(`${toChipString(chip.name)} (${chip.event})`);
    }
    return usedChips;
  }, []).join(', ');
}

/**
 * Adds the manager's active chip and used chips to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 * @param {number} currentGameweek
 */
function addChips(leagueTable, managers, currentGameweek) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'Active chip', 'Active chip');
  insertTableHeader(tableHead, 'Used chips', 'Used chips');

  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const activeChipCell = row.insertCell(-1);
    const usedChipsCell = row.insertCell(-1);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    activeChipCell.textContent = getActiveChip(currentManager.history.chips, currentGameweek);
    usedChipsCell.textContent = getUsedChips(currentManager.history.chips, currentGameweek);
  });
}

/**
 * Adds the manager's squad value and total money in the bank to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 */
function addSquadValue(leagueTable, managers) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'SV', 'Squad value');
  insertTableHeader(tableHead, 'ITB', 'In the bank');

  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const squadValueCell = row.insertCell(-1);
    const inTheBankCell = row.insertCell(-1);

    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    const squadValue = currentManager.entry.value / 10;
    const inTheBank = currentManager.entry.bank / 10;

    squadValueCell.textContent = `£${squadValue.toFixed(1)}`;
    inTheBankCell.textContent = `£${inTheBank.toFixed(1)}`;
  });
}

/**
 * Adds each manager's overall rank to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 */
function addOverallRank(leagueTable, managers) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'OR', 'Overall rank');

  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const overallRankCell = row.insertCell(-1);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);
    const overallRank = currentManager.entry.summary_overall_rank;

    overallRankCell.textContent = `${overallRank.toLocaleString()}`;
  });
}

/**
 * Returns the current live points scored by the given picks.
 * @param {Array<Object>} picks
 * @param {Object} liveData
 */
function getLivePoints(picks, liveData) {
  const livePlayers = liveData.elements;

  const livePoints = picks.slice(0, 11).reduce((totalPoints, player) => {
    const playerStats = livePlayers[player.element].explain[0][0];
    let playerPoints = 0;
    Object.values(playerStats).forEach((statistic) => {
      const points = statistic.points * player.multiplier;
      playerPoints += points;
    });
    return totalPoints + playerPoints;
  }, 0);

  return livePoints;
}

/**
 * Adds the manager's live points to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 * @param {Object} liveData
 */
function addLivePoints(leagueTable, managers, liveData) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'LP', 'Live points');
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const totalPointsCell = row.cells[3];
    const gameweekPoints = parseInt(row.cells[2].textContent, 10);
    const totalPoints = parseInt(totalPointsCell.textContent, 10);

    const livePointsCell = row.insertCell(-1);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    const livePoints = getLivePoints(currentManager.picks.picks, liveData);
    livePointsCell.textContent = livePoints;

    const pointsDifference = livePoints - gameweekPoints;
    totalPointsCell.textContent = totalPoints + pointsDifference;
  });
}

/**
 * Returns the number of players in the manager's starting eleven who have already played.
 * @param {Array<Object>} picks
 * @param {Object} liveData
 */
function getPlayersPlayed(picks, liveData) {
  const livePlayers = liveData.elements;

  const playersPlayed = picks.slice(0, 11)
    .filter(player => livePlayers[player.element].explain[0][0].minutes.value > 0);

  return playersPlayed.length;
}

/**
 * Adds the number of players (out of 11) in the manager's starting eleven who have already played
 * to the league table.
 * @param {Node} leagueTable
 * @param {Array<Object>} managers
 * @param {Object} liveData
 */
function addPlayersPlayed(leagueTable, managers, liveData) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'PP', 'Players played');
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const playersPlayedCell = row.insertCell(-1);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    const playersPlayed = getPlayersPlayed(currentManager.picks.picks, liveData);
    playersPlayedCell.textContent = `${playersPlayed}/11`;
  });
}

/**
 * Updates the league table with additional information.
 */
async function updateLeagueTable() {
  const players = await getPlayers();
  const currentGameweek = await getCurrentGameweek();
  const liveData = await getLiveData(currentGameweek);
  const classicLeague = await getClassicLeagueCS();
  const managerIds = classicLeague.standings.results.map(manager => manager.entry);

  const managers = await Promise.all(managerIds.map(async (managerId) => {
    const manager = await getUser(managerId);
    const managerHistory = await getUserHistory(managerId);
    const managerPicks = await getUserPicks(managerId, currentGameweek);

    manager.history = managerHistory;
    manager.picks = managerPicks;
    return manager;
  }));

  const leagueTable = document.getElementsByClassName('ism-table--standings')[0];

  addLivePoints(leagueTable, managers, liveData);
  addPlayersPlayed(leagueTable, managers, liveData);
  addOverallRank(leagueTable, managers);
  addSquadValue(leagueTable, managers);
  addCaptains(leagueTable, managers, players);
  addChips(leagueTable, managers, currentGameweek);
  addToggleTeamButton(leagueTable);
  addTeamRow(leagueTable, managers, players);
}

const classicLeagueObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && mutation.target.id === 'ismr-main'
          && leagueRegex.test(document.URL)) {
      updateLeagueTable();
    }
  });
});
classicLeagueObserver.observe(document.getElementById('ismr-main'), {
  childList: true,
  subtree: true,
});

/**
 * Adds the fixtures of all players in the transfer page sidebar.
 * @param {Array<Object>} players
 * @param {HTMLCollection} selectionElements
 */
async function addTransferFixtures(selectionElements) {
  if (teamToFixtures.length === 0) {
    teamToFixtures = await getTeamToFixtures();
  }

  Array.from(selectionElements).forEach((element) => {
    const teamShortName = element.querySelector('span').textContent.trim();
    const fixturesDiv = getFixturesDiv(teamToFixtures[teamShortName], true);
    element.insertAdjacentHTML('beforeend', fixturesDiv);
  });
}

/**
 * Function for handling the transfer page sidebar fixtures.
 */
async function handleTransferFixtures() {
  const playerSelectionElements = Array
    .from(document.getElementsByClassName('ism-media__body ism-table--el__primary-text'))
    .slice(15);
  addTransferFixtures(playerSelectionElements);
}

// function updatePriceFilter() {
//   const priceFilter = document.getElementById('ismjs-element-price');
//   const newOption = document.createElement('option');
//   newOption.setAttribute('value', 35);
//   newOption.textContent = '£3.5';
//   priceFilter.insertAdjacentElement('beforeend', newOption);
// }

/**
 * Increases the price of the /transfers maximum price filter.
 */
function increasePrice() {
  const priceFilter = document.getElementById('ismjs-element-price');
  if (priceFilter.selectedIndex === 0) return;
  priceFilter.selectedIndex -= 1;
  priceFilter.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Decreases the price of the /transfers maximum price filter.
 */
function decreasePrice() {
  const priceFilter = document.getElementById('ismjs-element-price');
  if (priceFilter.selectedIndex === priceFilter.options.length - 1) return;
  priceFilter.selectedIndex += 1;
  priceFilter.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Adds the increase and decrease price buttons for filtering players by the their maximum price to
 * the /transfers sidebar.
 */
function addPriceButtons() {
  const priceDiv = document.getElementById('ismr-price');
  if (priceDiv.classList.contains('price-filter')) return;

  priceDiv.className += ' price-filter';
  const increaseButton = document.createElement('div');
  const decreaseButton = document.createElement('div');

  increaseButton.className = 'price-change-button grid-center';
  increaseButton.textContent = '+';
  increaseButton.onclick = increasePrice;
  decreaseButton.className = 'price-change-button grid-center';
  decreaseButton.textContent = '-';
  decreaseButton.onclick = decreasePrice;

  priceDiv.insertAdjacentElement('beforeend', increaseButton);
  priceDiv.insertAdjacentElement('beforeend', decreaseButton);
}

const transferSidebarObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-side'
          || mutation.target.id === 'ismjs-elements-list-tables')
          && document.URL === 'https://fantasy.premierleague.com/a/squad/transfers') {
      handleTransferFixtures();
      addPriceButtons();
    }
  });
});
transferSidebarObserver.observe(document.getElementsByClassName('ism-container')[0], {
  childList: true,
  subtree: true,
});

/**
 * Updates the header style of the /transfer page to be more consistent.
 */
function updateHeaderStyle() {
  const elements = Array.from(document.getElementsByClassName('ism-scoreboard__item--3'));

  elements.forEach((element) => {
    element.style.height = '7rem';
    element.style.margin = 0;
    element.style.padding = 0;
    element.style.paddingTop = '0.5rem';
    element.style.borderBottomWidth = 0;
  });

  const autoPick = elements[0];
  const reset = elements[1];
  reset.style.borderLeft = '1px solid #E8E8E8';
  [autoPick, reset].forEach((element) => {
    element.style.padding = 0;
    element.style.borderTop = '1px solid #E8E8E8';

    const button = element.getElementsByClassName('ism-scoreboard__button')[0];
    button.style.border = 'none';
    button.style.height = '7rem';
    button.style.margin = 0;
    // Only transition background, not all
    button.style.transition = 'background 0.2s';
  });
}

const transferMainObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-main'
          || /ism-pitch__unit ism-pitch__unit--\d+/.test(mutation.target.className))
          && document.URL === 'https://fantasy.premierleague.com/a/squad/transfers') {
      addPlayerFixtures();
      updateFixtureStyle();
      updateHeaderStyle();
      addPlayerExpectedPoints(true);
      addTotalExpectedPoints(true);
      addPlayerTransferChange(true);
    }
  });
});
transferMainObserver.observe(document.getElementsByClassName('ism-container')[0], {
  childList: true,
  subtree: true,
});

/**
 * Tempoary fix for /points CSS Grid.
 */
function fixPoints() {
  const playerElements = Array.from(document.getElementsByClassName('ism-element__data')).slice(0, 15);
  playerElements.forEach((element) => {
    element.insertAdjacentHTML('afterbegin', '<div></div>');
  });
}

const pointsObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-main'
          && /https:\/\/fantasy.premierleague.com\/a\/team\/\d+\/event\/\d+/.test(document.URL))) {
      fixPoints();
    }
  });
});
pointsObserver.observe(document.getElementsByClassName('ism-container')[0], {
  childList: true,
  subtree: true,
});

/**
 * Changes game settings to allow filtering by more prices on /transfers by injecting script into
 * webpage.
 */
function runInPage() {
  const script = document.createElement('script');
  document.head.appendChild(script).text = `
    function setPriceGap() {
      const game = window.ISMApp.data['game-settings'].game;
      if (typeof game === 'undefined') {
        setTimeout(setPriceGap, 50);
      }
      game.ui_selection_price_gap = 1;
    }
    setPriceGap();
  `;
  script.remove();
}

runInPage();
