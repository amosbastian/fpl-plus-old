import '../css/main.scss';

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

/**
 * Returns a JSON object containing additional information about the player with the given
 * `playerId`.
 * @param {int} playerId
 */
async function getPlayer(playerId) {
  const response = await fetch(`https://fantasy.premierleague.com/drf/element-summary/${playerId}`);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns an array of teams participating in the Premier League.
 */
async function getTeams() {
  const response = await fetch('https://fantasy.premierleague.com/drf/teams/');
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }

  throw new Error(response.status);
}

/**
 * Returns a div containing a player's upcoming fixtures with their respective difficulty.
 * @param {Array} fixtures
 */
function getFixturesDiv(fixtures) {
  let fixtureElements = '';
  fixtures.forEach((fixture) => {
    const fixtureTitle = `${fixture.opponent_short_name} (${fixture.is_home ? 'H' : 'A'})`;
    const fixtureElement = `<div class="fixture-square fdr--${fixture.difficulty}" title="${fixtureTitle}"></div>`;
    fixtureElements += fixtureElement;
  });
  return `
  <div class="player-fixtures">
    ${fixtureElements}
  </div>
  `;
}

/**
 * Adds a div containing the player's upcoming 5 fixtures under each player element
 * in the team section.
 */
async function addPlayerFixtures() {
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

  /* Assign player's fixtures to property and use them to create the div. */
  await Promise.all(teamPlayers.map(async (player) => {
    const response = await getPlayer(player.id);
    player.fixtures = response.fixtures.slice(0, 5);
  }));

  teamPlayers.forEach((player) => {
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

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0 && mutation.target.id === 'ismr-main') {
      updateMyTeamStyle();
      addPlayerFixtures();
    }
  });
});
observer.observe(document.getElementById('ismr-main'), {
  childList: true,
  subtree: true,
});
