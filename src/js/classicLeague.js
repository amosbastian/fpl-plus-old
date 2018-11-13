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

function toggleTeam() {
  const teamRow = this.parentElement.parentElement.nextElementSibling;

  if (this.textContent === 'Show team') {
    this.textContent = 'Hide team';
  } else {
    this.textContent = 'Show team';
  }

  this.classList.toggle('button-toggle-team--active');
  teamRow.classList.toggle('manager-team--hidden');
}

/**
 * Updates the league table with additional information.
 */
async function updateLeagueTable() {
  const currentGameweek = await getCurrentGameweek();
  const classicLeague = await getClassicLeague();
  const managerIds = classicLeague.standings.results.map(manager => manager.entry);

  const managers = await Promise.all(managerIds.map(async (managerId) => {
    const manager = await getUser(managerId);
    const managerPicks = await getUserPicks(managerId, currentGameweek);
    // const managerHistory = await getUserHistory(managerId);
    manager.picks = managerPicks;
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
    newRow.className = 'manager-team manager-team--hidden';
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
