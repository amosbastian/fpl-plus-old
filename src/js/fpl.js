const retry = require('async-retry');

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

export const leagueRegex = /^https:\/\/fantasy.premierleague.com\/a\/leagues\/standings\/(\d+)\/classic(\S+)?$/;

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
 * Returns a classic league.
 * @returns {Object}
 */
export const getClassicLeague = async () => retry(async () => {
  const endpoint = getLeagueEndpoint();
  const response = await fetch(endpoint);
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
