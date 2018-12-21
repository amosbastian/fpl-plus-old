import '../css/main.scss';
import { getCurrentGameweek, getFixtures, getLocalTeams } from './fpl';

const gameweekDayOptions = {
  weekday: 'long', month: 'long', day: 'numeric',
};

const fixtureTimeOptions = {
  hour: '2-digit', minute: '2-digit',
};

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

async function populateFixtures(gameweek = 0) {
  const teams = await getLocalTeams();
  const currentGameweek = gameweek || await getCurrentGameweek();
  const fixtures = await getFixtures(currentGameweek);

  const eventDays = [...new Set(fixtures.map(fixture => fixture.event_day))];
  const fixturesElement = document.getElementById('fpl-fixtures');

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

document.addEventListener('DOMContentLoaded', () => {
  populateFixtures();
});
