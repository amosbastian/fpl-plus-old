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
async function createTeamDiv(picks) {
  const allPlayers = await getPlayers();
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
    return;
  }
  this.textContent = 'Hide team';

  // Button was clicked before, no need to reload team.
  if (teamRow.innerHTML.includes('h5')) return;

  const currentGameweek = await getCurrentGameweek();
  const managerId = getIdFromRow(parentRow);
  const managerPicks = await getUserPicks(managerId, currentGameweek);
  teamRow.getElementsByTagName('td')[0].appendChild(await createTeamDiv(managerPicks.picks));
}

/**
 * Updates the league table with additional information.
 */
async function updateLeagueTable() {
  const classicLeague = await getClassicLeague();
  const managerIds = classicLeague.standings.results.map(manager => manager.entry);

  const managers = await Promise.all(managerIds.map(async (managerId) => {
    const manager = await getUser(managerId);
    // const managerHistory = await getUserHistory(managerId);
    // manager.history = managerHistory;
    return manager;
  }));

  const leagueTable = document.getElementsByClassName('ism-table--standings')[0];
  // const tableHead = leagueTable.tHead;
  const tableBody = leagueTable.tBodies[0];
  const bodyRows = tableBody.getElementsByTagName('tr');
  Array.from(bodyRows).forEach((row) => {
    const toggleTeamCell = row.insertCell(-1);
    const toggleTeamButton = document.createElement('div');

    toggleTeamCell.appendChild(toggleTeamButton);
    toggleTeamButton.className = 'button-toggle-team';
    toggleTeamButton.innerHTML = 'Show team';
    toggleTeamButton.addEventListener('click', toggleTeam);

    const newRow = tableBody.insertRow(row.rowIndex);
    newRow.className = 'manager-team-row manager-team-row--hidden';
    newRow.innerHTML = `
      <td colspan="${row.getElementsByTagName('td').length}">
      </td>
    `;
  });
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
