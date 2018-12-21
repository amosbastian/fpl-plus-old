import '../css/main.scss';
import { getCurrentGameweek, getFixtures, getLocalTeams } from './fpl';

const gameweekDayOptions = {
  weekday: 'long', month: 'long', day: 'numeric',
};

const fixtureTimeOptions = {
  hour: '2-digit', minute: '2-digit',
};

const gameweeks = [...Array(38).keys()];

/**
 * Shows a table of all leagues a user is participating in.
 */
function showFixtures() {
  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.add('hidden');
    return;
  }

  // Dropdown triangles
  fixtureTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  const fixtureContainers = Array.from(document.getElementsByClassName('fixtures-container'));
  fixtureContainers.forEach(container => container.classList.add('hidden'));

  const currentContainer = this.parentElement.nextElementSibling;
  currentContainer.classList.toggle('hidden');
}

/**
 * Populates the fixture page with a header showing the gameweek's event days, with each containing
 * a section beneath it with all the event's fixtures with their kickoff time / score.
 * @param {number} gameweek
 */
async function populateFixtures(gameweek = 0) {
  const teams = await getLocalTeams();
  const currentGameweek = gameweek || await getCurrentGameweek();
  const fixtures = await getFixtures(currentGameweek);

  const eventDays = [...new Set(fixtures.map(fixture => fixture.event_day))];
  const fixturesElement = document.getElementById('fpl-fixtures');

  // Remove existing fixtures if applicable.
  while (fixturesElement.firstChild) {
    fixturesElement.removeChild(fixturesElement.firstChild);
  }

  eventDays.forEach((eventDay) => {
    const eventFixtures = fixtures.filter(fixture => fixture.event_day === eventDay);
    const kickoffTime = new Date(eventFixtures[0].kickoff_time);
    const gameweekDay = kickoffTime.toLocaleDateString('en-GB', gameweekDayOptions);
    fixturesElement.insertAdjacentHTML('beforeend', `
      <div class="fixture-date">
        <span class="icon-triangle-right fixtures"></span>
        ${gameweekDay}
      </div>
    `);

    const fixturesContainer = document.createElement('div');
    fixturesContainer.className = 'fixtures-container';

    eventFixtures.forEach((fixture) => {
      const homeTeam = teams.find(team => team.id === fixture.team_h).name;
      const awayTeam = teams.find(team => team.id === fixture.team_a).name;
      const fixtureTime = kickoffTime.toLocaleTimeString('en-GB', fixtureTimeOptions);

      fixturesContainer.insertAdjacentHTML('beforeend', `
        <div class="fpl-fixture">
          <div class="fixture-team fixture-team--home">${homeTeam}</div>
          <div class="fixture-information fixture-information--time">${fixtureTime}</div>
          <div class="fixture-team fixture-team--away">${awayTeam}</div>
        </div>
      `);
    });

    fixturesElement.insertAdjacentElement('beforeend', fixturesContainer);
  });

  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  fixtureTriangles.forEach((triangle) => {
    triangle.addEventListener('click', showFixtures);
  });
}

async function updateGameweek() {
  const selectedGameweek = this.options[this.selectedIndex].value;
  populateFixtures(selectedGameweek);
}

/**
 * Populates the gameweek select with all possible gameweeks and sets the selected gameweek as the
 * current gameweek.
 */
async function populateGameweekSelect() {
  const gameweekSelect = document.getElementById('gameweek-fixtures-select');

  gameweeks.forEach((gameweek) => {
    const gameweekOption = document.createElement('option');
    gameweekOption.text = `Gameweek ${gameweek + 1}`;
    gameweekOption.value = gameweek + 1;
    gameweekSelect.add(gameweekOption);
  });

  const currentGameweek = await getCurrentGameweek();
  gameweekSelect.selectedIndex = currentGameweek - 1;
  gameweekSelect.addEventListener('click', updateGameweek);
}

document.addEventListener('DOMContentLoaded', () => {
  populateFixtures();
  populateGameweekSelect();
});
