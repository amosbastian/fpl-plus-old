import '../css/main.scss';

const leagueRegex = /^https:\/\/fantasy.premierleague.com\/a\/leagues\/standings\/(\d+)\/classic(\S+)?$/;

/**
 * Returns the league's API endpoint depending on the current page the user is on.
 * @returns {string}
 */
function getLeagueEndpoint() {
  const regexMatch = leagueRegex.exec(document.URL);
  const leagueId = regexMatch[1];
  const queryParameters = (typeof regexMatch[2] !== 'undefined') ? regexMatch[2] : '?phase=1&le-page=1&ls-page=1';
  return `https://fantasy.premierleague.com/drf/leagues-classic-standings/${leagueId}${queryParameters}`;
}

/**
 * Returns the current gameweek.
 * @returns {number}
 */
async function getCurrentGameweek() {
  const response = await fetch('https://fantasy.premierleague.com/drf/bootstrap-dynamic');
  if (response.status === 200) {
    const json = await response.json();
    return json.entry.current_event;
  }

  throw new Error(response.status);
}

/**
 *  Returns the user with the given `userId`.
 * @param {number|string} userId
 * @returns {Object}
 */
async function getUser(userId) {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns the picks in the given gameweek of the user with the given `userId`.
 * @param {number|string} userId
 * @param {number} gameweek
 * @returns {Object}
 */
async function getUserPicks(userId, gameweek) {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}/event/${gameweek}/picks`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns the history of the user with the given `userId`.
 * @param {number|string} userId
 * @returns {Object}
 */
async function getUserHistory(userId) {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}/history`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns a classic league.
 * @returns {Object}
 */
async function getClassicLeague() {
  const endpoint = getLeagueEndpoint();
  const response = await fetch(endpoint);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns an array of all players playing for teams in the Premier League.
 */
async function getPlayers() {
  const response = await fetch('https://fantasy.premierleague.com/drf/elements/');
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

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

  // Sort players by position so it's GK -> DEF -> MID -> FWD.
  players
    .sort((a, b) => (playerIds.indexOf(a.id) > playerIds.indexOf(b.id) ? 1 : -1))
    .forEach((player) => {
      const playerText = document.createElement('p');
      playerText.style.textAlign = textAlignment;
      playerText.textContent = player.web_name;
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

function insertTableHeader(tableHead, content) {
  const th = document.createElement('th');
  const spanHeader = document.createElement('span');

  spanHeader.className = 'ismjs-tooltip ismjs-tooltip--grouped ism-tooltip tooltipstered';
  spanHeader.textContent = (content === 'captain') ? 'C' : 'VC';
  spanHeader.title = `${content.replace('-', ' ')[0].toUpperCase() + content.replace('-', ' ').substr(1)}`;

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
async function addCaptains(leagueTable, managers, players) {
  const tableHead = leagueTable.tHead.getElementsByTagName('tr')[0];
  insertTableHeader(tableHead, 'captain');
  insertTableHeader(tableHead, 'vice-captain');
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');

  Array.from(bodyRows).forEach((row) => {
    const captainCell = row.insertCell(4);
    const viceCaptainCell = row.insertCell(5);
    const managerId = parseInt(getIdFromRow(row), 10);
    const currentManager = managers.find(manager => manager.entry.id === managerId);

    const captain = getCaptain(currentManager.picks.picks, players);
    const viceCaptain = getViceCaptain(currentManager.picks.picks, players);

    captainCell.textContent = `${captain.web_name}`;
    viceCaptainCell.textContent = `${viceCaptain.web_name}`;
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
    manager.history = managerHistory;
    const managerPicks = await getUserPicks(managerId, currentGameweek);
    manager.picks = managerPicks;
    return manager;
  }));

  const leagueTable = document.getElementsByClassName('ism-table--standings')[0];
  addToggleTeamButton(leagueTable);
  addCaptains(leagueTable, managers, players);
  addTeamRow(leagueTable, managers, players);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0
          && mutation.target.id === 'ismr-main'
          && leagueRegex.test(document.URL)) {
      updateLeagueTable();
    }
  });
});
observer.observe(document.getElementById('ismr-main'), {
  childList: true,
  subtree: true,
});
