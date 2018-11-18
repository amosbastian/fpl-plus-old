import { getTeams, getPlayers, getPlayer } from './fpl';

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

chrome.runtime.onInstalled.addListener(async () => {
  saveTeams();
  savePlayers();
  saveTeamToFixtures();
});
