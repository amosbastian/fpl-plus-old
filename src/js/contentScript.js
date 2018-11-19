import '../css/main.scss';
import {
  getClassicLeague, getCurrentGameweek, getPlayers, getTeams, getUser, getUserPicks,
  getUserHistory, leagueRegex, getTeamToFixtures, getLocalTeams, getLocalPlayers,
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
async function getTeamPlayers() {
  if (allTeams.length === 0) {
    allTeams = await getLocalTeams();
  }

  if (allPlayers.length === 0) {
    allPlayers = await getLocalPlayers();
  }

  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);
  const teamPlayers = playerElements.map((element) => {
    const playerName = element.querySelector('div > .ism-element__name').textContent;
    const teamName = element.querySelector('picture > img').getAttribute('alt');

    if (teamName === 'Click to select a replacement') {
      // TODO: make more robust.
      return allPlayers.find(player => player.web_name);
    }
    const teamId = allTeams.find(team => team.name === teamName).id;
    return allPlayers.find(player => player.web_name === playerName && player.team === teamId);
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
  const teamPlayers = await getTeamPlayers();
  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);

  Array.from(playerElements).forEach((playerElement) => {
    let element = playerElement;
    if (!transfers) {
      element = playerElement.querySelector('div');
    }

    const playerName = element.querySelector('.ism-element__name').textContent;
    const nextFixture = element.querySelector('.ism-element__data');
    const player = teamPlayers.find(playerObject => playerObject.web_name === playerName);

    const alreadyAdded = nextFixture.getElementsByClassName('ep-this');
    if (alreadyAdded.length === 0) {
      nextFixture.insertAdjacentHTML('beforeend', `<div class="grid-center ep-this">${player.ep_this}</div>`);
    }
  });
}

async function getSelectedByElement(player) {
  const totalPlayers = 59000;
  const selectedBy = player.selected_by_percent * totalPlayers;
  const transfersOut = player.transfers_out_event;
  const transfersIn = player.transfers_in_event;
}

async function addPlayerTransferChange(transfers = false) {
  const teamPlayers = await getTeamPlayers();
  const playerElements = Array.from(document.getElementsByClassName('ismjs-menu')).slice(0, 15);

  Array.from(playerElements).forEach((playerElement) => {
    let element = playerElement;
    if (!transfers) {
      element = playerElement.querySelector('div');
    }

    const playerName = element.querySelector('.ism-element__name').textContent;
    const nextFixture = element.querySelector('.ism-element__data');
    const player = teamPlayers.find(playerObject => playerObject.web_name === playerName);

    const alreadyAdded = nextFixture.getElementsByClassName('selected-by');
    if (alreadyAdded.length === 0) {
      nextFixture.insertAdjacentHTML('afterbegin', `<div class="grid-center selected-by">${player.selected_by_percent}</div>`);
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

async function addTotalExpectedPoints(transfers = false) {
  if (!document.querySelector('.expected-points')) {
    createExpectedPointsElement(transfers);
  }

  const teamPlayers = await getTeamPlayers();
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
 * Updates My Team's style to accomodate the changes.
 */
function updateMyTeamStyle() {
  updateFixtureStyle();
  updateBenchStyle();
}

const myTeamObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
        && (mutation.target.id === 'ismr-main' || mutation.target.id === 'ismr-summary-bench')
        && document.URL === 'https://fantasy.premierleague.com/a/team/my') {
      updateMyTeamStyle();
      addPlayerFixtures();
      addPlayerExpectedPoints();
      addTotalExpectedPoints();
      addPlayerTransferChange();
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
  teamDiv.appendChild(createPlayersDiv(allPlayers, picks, 'starter'));
  teamDiv.appendChild(createPlayersDiv(allPlayers, picks, 'ben'));
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
 * @param {None} leagueTable
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
 * Updates the league table with additional information.
 */
async function updateLeagueTable() {
  const players = await getPlayers();
  const currentGameweek = await getCurrentGameweek();
  const classicLeague = await getClassicLeague();
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

const transferSidebarObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-side' || mutation.target.id === 'ismjs-elements-list-tables')
          && document.URL === 'https://fantasy.premierleague.com/a/squad/transfers') {
      handleTransferFixtures();
    }
  });
});
transferSidebarObserver.observe(document.getElementsByClassName('ism-container')[0], {
  childList: true,
  subtree: true,
});

const transferMainObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-main' || /ism-pitch__unit ism-pitch__unit--\d+/.test(mutation.target.className))
          && document.URL === 'https://fantasy.premierleague.com/a/squad/transfers') {
      addPlayerFixtures();
      updateFixtureStyle();
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
