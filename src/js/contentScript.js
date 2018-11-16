import '../css/main.scss';
import {
  getClassicLeague, getCurrentGameweek, getPlayer, getPlayers, getTeams, getUser, getUserPicks,
  getUserHistory, leagueRegex,
} from './fpl';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * My Team                                                                                         *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

/**
 * Returns a div containing a player's upcoming fixtures with their respective difficulty.
 * @param {Array} fixtures
 */
function getFixturesDiv(fixtures, transfers = false) {
  let fixtureElements = '';
  let className = transfers ? 'fixture-square--small' : 'fixture-square';
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
 * Returns an Array containing an Array of a team's players and an HTMLCollection containing each
 * player's respective span.
 */
async function initPlayers() {
  const playerSpans = document.getElementsByClassName('ism-element__menu');
  const playerNames = Array.from(playerSpans).map(collection => collection.querySelector('div > .ism-element__name').textContent);

  const allTeams = await getTeams();

  /* Roundabout way of getting each player's team's ID. */
  const teamNames = Array.from(playerSpans).map(collection => collection.querySelector('picture > img').getAttribute('alt'));
  const teamNameToId = new Map(allTeams.map(team => [team.name, team.id]));
  const teamIds = teamNames.map(teamName => teamNameToId.get(teamName));

  const playerObjects = playerNames.map((name, index) => ({ name, team: teamIds[index] }));

  const allPlayers = await getPlayers();
  const teamPlayers = playerObjects.map(playerObject => allPlayers
    .find(player => player.web_name === playerObject.name && player.team === playerObject.team));

  return [teamPlayers, playerSpans];
}

/**
 * Adds a div containing the player's upcoming 5 fixtures under each player element
 * in the team section.
 */
async function addPlayerFixtures() {
  const [players, playerSpans] = await initPlayers();

  /* Assign player's fixtures to property and use them to create the div. */
  await Promise.all(players.map(async (player) => {
    const response = await getPlayer(player.id);
    player.fixtures = response.fixtures.slice(0, 5);
  }));

  players.forEach((player) => {
    Array.from(playerSpans).forEach((span) => {
      const playerDiv = span.querySelector('div');
      const playerName = playerDiv.querySelector('.ism-element__name').textContent;

      if (playerName === player.web_name) {
        const fixturesDiv = getFixturesDiv(player.fixtures);
        playerDiv.insertAdjacentHTML('beforeend', fixturesDiv);
      }
    });
  });
}

/**
 * Adds each player's expection points next to their next fixture.
 */
async function addPlayerExpectedPoints() {
  const [players, playerSpans] = await initPlayers();

  players.forEach((player) => {
    Array.from(playerSpans).forEach((span) => {
      const playerDiv = span.querySelector('div');
      const playerName = playerDiv.querySelector('.ism-element__name').textContent;
      const nextFixture = playerDiv.querySelector('.ism-element__data');

      if (playerName === player.web_name) {
        nextFixture.textContent += ` - ${player.ep_this}`;
      }
    });
  });
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
function createPlayersDiv(allPlayers, picks, playerType) {
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
function createTeamDiv(picks, allPlayers) {
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
 * Returns an array of player objects that are currently shown in the transfer page sidebar.
 * @param {HTMLCollection} playerSelectionElements
 * @param {Array<Object>} allTeams
 * @param {Array<Object>} allPlayers
 */
function getPlayerSelection(playerSelectionElements, allTeams, allPlayers) {
  /* Roundabout way of getting each player's team's ID. */
  const playerNames = Array.from(playerSelectionElements).map(collection => collection.querySelector('a').textContent);
  const teamShortNames = Array.from(playerSelectionElements).map(collection => collection.querySelector('span').textContent);
  const teamShortNameToId = new Map(allTeams.map(team => [team.short_name, team.id]));
  const teamIds = teamShortNames.map(teamShortName => teamShortNameToId.get(teamShortName));
  const playerObjects = playerNames.map((name, index) => ({ name, team: teamIds[index] }));

  const playerSelection = playerObjects.map(playerObject => allPlayers
    .find(player => player.web_name === playerObject.name && player.team === playerObject.team));

  return playerSelection;
}

/**
 * Adds the fixtures of all players in the transfer page sidebar.
 * @param {Array<Object>} players
 * @param {HTMLCollection} selectionElements
 */
async function addTransferFixtures(players, selectionElements) {
  await Promise.all(players.map(async (player) => {
    const response = await getPlayer(player.id);
    player.fixtures = response.fixtures.slice(0, 5);
  }));

  players.forEach((player) => {
    Array.from(selectionElements).forEach((element) => {
      const playerName = element.querySelector('a').textContent;

      if (playerName === player.web_name) {
        const fixturesDiv = getFixturesDiv(player.fixtures, true);
        element.insertAdjacentHTML('beforeend', fixturesDiv);
      }
    });
  });
}

/**
 * Function for handling the transfer page sidebar fixtures.
 */
async function handleTransferFixtures() {
  const playerSelectionElements = Array
    .from(document.getElementsByClassName('ism-media__body ism-table--el__primary-text'))
    .slice(15);
  const allTeams = await getTeams();
  const allPlayers = await getPlayers();
  const playerSelection = getPlayerSelection(playerSelectionElements, allTeams, allPlayers);
  addTransferFixtures(playerSelection, playerSelectionElements);
}

const transferObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && (mutation.target.id === 'ismr-side' || mutation.target.id === 'ismjs-elements-list-tables')
          && document.URL === 'https://fantasy.premierleague.com/a/squad/transfers') {
      handleTransferFixtures();
    }
  });
});
transferObserver.observe(document.getElementById('ismr-side'), {
  childList: true,
  subtree: true,
});
