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
 * Sorts fixtures by most recent kickoff time and returns the event day of the most recent fixture.
 * @param {Array<Object>} fixtures
 */
function getActiveEventDay(fixtures) {
  const today = new Date();
  const fixturesCopy = fixtures.slice(0);

  // Sort by most recent kickoff time.
  fixturesCopy.sort((a, b) => {
    const differenceA = Math.abs(today - new Date(a.kickoff_time));
    const differenceB = Math.abs(today - new Date(b.kickoff_time));
    return differenceA - differenceB;
  });

  const nearestFixture = fixturesCopy[0];
  return nearestFixture.event_day;
}

/**
 * Populates the fixture page with a header showing the gameweek's event days, with each containing
 * a section beneath it with all the event's fixtures with their kickoff time / score.
 * @param {number} gameweek
 */
async function populateFixtures(gameweek = 0) {
  const teams = await getLocalTeams();
  const currentGameweek = parseInt(gameweek, 10) || await getCurrentGameweek();
  const fixtures = await getFixtures(currentGameweek + 1);
  const activeEventDay = getActiveEventDay(fixtures);

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

    // Set class if current `eventDay` is the active one.
    const fixtureDateClass = `${eventFixtures[0].event_day === activeEventDay ? 'active' : ''}`;
    const fixtureDisplayClass = `${eventFixtures[0].event_day !== activeEventDay ? 'hidden' : ''}`;

    fixturesElement.insertAdjacentHTML('beforeend', `
      <div class="fixture-date">
        <span class="icon-triangle-right fixtures ${fixtureDateClass}"></span>
        ${gameweekDay}
      </div>
    `);

    const fixturesContainer = document.createElement('div');
    fixturesContainer.className = `fixtures-container ${fixtureDisplayClass}`;

    eventFixtures.forEach((fixture) => {
      const homeTeam = teams.find(team => team.id === fixture.team_h);
      console.log(homeTeam);
      const awayTeam = teams.find(team => team.id === fixture.team_a);

      const fixtureTime = kickoffTime.toLocaleTimeString('en-GB', fixtureTimeOptions);
      const fixtureScore = `${fixture.team_h_score} - ${fixture.team_a_score}`;

      const informationClass = `fixture-information fixture-information--${fixture.finished ? 'score' : 'time'}`;
      const informationContent = `${fixture.finished ? fixtureScore : fixtureTime}`;

      fixturesContainer.insertAdjacentHTML('beforeend', `
        <div class="fpl-fixture">
          <div class="fixture-team fixture-team--home">${homeTeam.name}</div>
          <span class="team-badge ${homeTeam.short_name}"></span>
          <div class="${informationClass}">${informationContent}</div>
          <span class="team-badge ${awayTeam.short_name}"></span>
          <div class="fixture-team fixture-team--away">${awayTeam.name}</div>
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
