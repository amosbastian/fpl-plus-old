import {
  getTeams, getPlayers, getPlayer, getUser, getUserPicks, getUserHistory, getCurrentGameweek,
  getLocalUser,
  getFixtures,
} from './fpl';

/**
 * Creates a Map containing each team's short name and name as property and their next 5 fixtures
 * as the respective value.
 *
 * @returns Array<Object>
 */
async function getTeamToFixtures() {
  const allTeams = await getTeams();
  const allPlayers = await getPlayers();
  // Players with distinct team ID.
  const teamIds = {};
  const uniquePlayers = allPlayers.filter((player) => {
    if (teamIds[player.team]) {
      return false;
    }
    teamIds[player.team] = true;
    return player;
  });

  const teamToFixtures = {};
  await Promise.all(uniquePlayers.map(async (uniquePlayer) => {
    const player = await getPlayer(uniquePlayer.id);
    const playerTeam = allTeams.find(team => team.id === uniquePlayer.team);
    teamToFixtures[playerTeam.short_name] = player.fixtures.slice(0, 5);
    teamToFixtures[playerTeam.name] = player.fixtures.slice(0, 5);
  }));
  return teamToFixtures;
}

async function saveTeamToFixtures() {
  const teamToFixtures = await getTeamToFixtures();
  chrome.storage.local.set({ teamToFixtures });
}

async function saveTeams() {
  const teams = await getTeams();
  chrome.storage.local.set({ teams });
}

async function savePlayers() {
  const players = await getPlayers();
  chrome.storage.local.set({ players });
}

async function saveFixtures() {
  const fixtures = await getFixtures();
  chrome.storage.local.set({ fixtures });
}

/**
 * Updates the information of the user saved in localStorage.
 * @param {number} userId
 */
async function updateUser(userId) {
  const currentGameweek = await getCurrentGameweek();
  const user = await getUser(userId);
  const picks = await getUserPicks(userId, currentGameweek);
  const history = await getUserHistory(userId);

  user.picks = picks;
  user.history = history;

  chrome.storage.local.set({ user });
}

/**
 * Updates teams, players, teamToFixtures and user in localStorage (if applicable).
 */
export async function updateData() {
  saveFixtures();
  saveTeams();
  savePlayers();
  saveTeamToFixtures();
  const user = await getLocalUser();
  if (typeof user !== 'undefined') {
    updateUser(user.entry.id);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  updateData();
  // Set alarm to update data that could be outdated.
  chrome.alarms.create('updater', { delayInMinutes: 0.1, periodInMinutes: 30.0 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updater') {
    updateData();
  }
});
