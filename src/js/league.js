import { getCurrentLeague } from './fpl';

function updateLeagueName(league) {
  const header = document.getElementById('league-overview').firstElementChild.lastElementChild;
  header.textContent = `${league.league.name}`;
}

async function updateLeague() {
  const league = await getCurrentLeague();
  updateLeagueName(league);
}

/**
 * Observe changes of the league overview element's style (display: none -> grid).
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.oldValue === null || mutation.oldValue === 'display: none') {
      updateLeague();
    }
  });
});
observer.observe(document.getElementById('league-overview'), {
  attributes: true,
  attributeFilter: ['style'],
  attributeOldValue: true,
});
