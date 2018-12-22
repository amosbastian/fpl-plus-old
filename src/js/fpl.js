const retry = require('async-retry');

export const leagueRegex = /^https:\/\/fantasy.premierleague.com\/a\/leagues\/standings\/(\d+)\/classic(\S+)?$/;

/**
 * Returns the current gameweek.
 * @returns {number}
 */
export const getCurrentGameweek = async () => retry(async () => {
  const response = await fetch('https://fantasy.premierleague.com/drf/bootstrap-dynamic');
  if (response.status === 200) {
    const json = await response.json();
    return json.entry.current_event;
  }

  throw new Error(response.status);
});

/**
 *  Returns the user with the given `userId`.
 * @param {number|string} userId
 * @returns {Object}
 */
export const getUser = async userId => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns the picks in the given gameweek of the user with the given `userId`.
 * @param {number|string} userId
 * @param {number} gameweek
 * @returns {Object}
 */
export const getUserPicks = async (userId, gameweek) => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}/event/${gameweek}/picks`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns the history of the user with the given `userId`.
 * @param {number|string} userId
 * @returns {Object}
 */
export const getUserHistory = async userId => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/entry/${userId}/history`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns the league's API endpoint depending on the current page the user is on.
 * @returns {string}
 */
function getLeagueEndpoint() {
  const regexMatch = leagueRegex.exec(document.URL);
  const leagueId = regexMatch[1];
  let queryParameters = (typeof regexMatch[2] !== 'undefined') ? regexMatch[2] : '?phase=1&le-page=1&ls-page=1';
  queryParameters = queryParameters.replace('lePage', 'le-page').replace('lsPage', 'ls-page');
  return `https://fantasy.premierleague.com/drf/leagues-classic-standings/${leagueId}${queryParameters}`;
}

/**
 * Returns a classic league (tailored for the content script).
 * @returns {Object}
 */
export const getClassicLeagueCS = async () => retry(async () => {
  const endpoint = getLeagueEndpoint();
  const response = await fetch(endpoint);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns the classic league in the given phase with the given leagueId.
 * @param {number} leagueId
 * @param {number} phase
 * @returns {Object}
 */
export const getClassicLeague = async (leagueId, phase = 1) => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/leagues-classic-standings/${leagueId}?phase=${phase}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns a H2H league.
 * @returns {Object}
 */
export const getH2HLeague = async leagueId => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/leagues-h2h-standings/${leagueId}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns an array of all players playing for teams in the Premier League.
 */
export const getPlayers = async () => retry(async () => {
  const response = await fetch('https://fantasy.premierleague.com/drf/elements/');
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns a JSON object containing additional information about the player with the given
 * `playerId`.
 * @param {int} playerId
 */
export const getPlayer = async playerId => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/element-summary/${playerId}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns an array of teams participating in the Premier League.
 */
export const getTeams = async () => retry(async () => {
  const response = await fetch('https://fantasy.premierleague.com/drf/teams/');
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns an array of the fixtures in the Premier League.
 */
export const getFixtures = async (gameweek = 0) => retry(async () => {
  const endpoint = `https://fantasy.premierleague.com/drf/fixtures/${gameweek ? `?event=${gameweek}` : ''}`;
  const response = await fetch(endpoint);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

/**
 * Returns a JSON object containing live data for the current gameweek.
 * @param {number} gameweek
 */
export const getLiveData = async gameweek => retry(async () => {
  const response = await fetch(`https://fantasy.premierleague.com/drf/event/${gameweek}/live`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
});

export const getLocalTeams = () => new Promise((resolve) => {
  chrome.storage.local.get('teams', data => resolve(data.teams));
});

export const getLocalPlayers = () => new Promise((resolve) => {
  chrome.storage.local.get('players', data => resolve(data.players));
});

export const getTeamToFixtures = () => new Promise((resolve) => {
  chrome.storage.local.get('teamToFixtures', data => resolve(data.teamToFixtures));
});

export const getLocalUser = () => new Promise((resolve) => {
  chrome.storage.local.get('user', data => resolve(data.user));
});

export const getLocalFixtures = () => new Promise((resolve) => {
  chrome.storage.local.get('fixtures', data => resolve(data.fixtures));
});

/**
 * Sets the display of all <div>s to 'none' if they have an ID !== pageId.
 * @param {string} pageId
 */
export const showPage = (pageId) => {
  const pages = document.querySelectorAll('.fpl-container > div');
  pages.forEach((page) => {
    if (page.id) {
      if (page.id !== pageId) { page.style.display = 'none'; }
    }
  });
  document.querySelector(`.fpl-container > div#${pageId}`).style.display = 'grid';
  chrome.storage.local.set({ currentPage: pageId });
};

export const getCurrentPage = () => new Promise((resolve) => {
  chrome.storage.local.get('currentPage', data => resolve(data.currentPage));
});

export const getPreviousPage = () => new Promise((resolve) => {
  chrome.storage.local.get('previousPage', data => resolve(data.previousPage));
});

export const getCurrentLeague = () => new Promise((resolve) => {
  chrome.storage.local.get('currentLeague', data => resolve(data.currentLeague));
});

/**
 * Returns an array of maxLength (or less) page numbers where a 0 in the returned array denotes a
 * gap in the series.
 *
 * Idea taken from: https://stackoverflow.com/a/46385144/4255859
 * @param {number} totalLeagues
 * @param {number} page
 * @param {number} maxLength
 */
export const getPageList = (totalLeagues, page, maxLength) => {
  function range(start, end) {
    return Array.from(Array(end - start + 1), (_, i) => i + start);
  }

  const sideWidth = maxLength < 9 ? 1 : 2;
  const leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
  const rightWidth = (maxLength - sideWidth * 2 - 2) >> 1;

  // No ...
  if (totalLeagues <= maxLength) {
    return range(1, totalLeagues);
  }
  // No ... on left side
  if (page <= maxLength - sideWidth - 1 - rightWidth) {
    return range(1, maxLength - sideWidth - 1)
      .concat([0])
      .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
  }
  // No ... on right side
  if (page >= totalLeagues - sideWidth - 1 - rightWidth) {
    return range(1, sideWidth)
      .concat([0])
      .concat(range(totalLeagues - sideWidth - 1 - rightWidth - leftWidth, totalLeagues));
  }
  // ... on both sides
  return range(1, sideWidth)
    .concat([0])
    .concat(range(page - leftWidth, page + rightWidth))
    .concat([0])
    .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
};
