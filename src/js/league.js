import { getCurrentLeague, showPage } from './fpl';

function updateLeagueName(league) {
  const header = document.getElementById('league-overview').firstElementChild.lastElementChild;
  header.textContent = `${league.league.name}`;
}

const limitPerPage = 7;

function showTableRows(currentPage) {
  const leagueRows = Array.from(document.getElementsByClassName('fpl-league-table-row--body'));
  leagueRows.forEach((leagueRow) => {
    leagueRow.classList.add('hidden');
  });

  leagueRows.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage)
    .forEach((leagueRow) => {
      leagueRow.classList.remove('hidden');
    });
}

function populateLeagueTable(league) {
  const leagueTable = document.getElementById('league-table');
  const standings = league.standings.results;
  standings.forEach((manager) => {
    let rankChange = '<span class="icon-triangle-up movement-league movement-league--up">';
    if (manager.movement === 'down') {
      rankChange = '<span class="icon-triangle-down movement-league movement-league--down"></span>';
    } else if (manager.movement === 'same') {
      rankChange = '<span><div class="icon-circle movement-league movement-league--same"></div></span>';
    }

    leagueTable.insertAdjacentHTML('beforeend', `
      <div class="fpl-league-table-row fpl-league-table-row--body">
        <div class="manager-rank">
          ${manager.rank}
          ${rankChange}
        </div>
        <div class="league-table-manager">
          <div>${manager.entry_name}</div>
          <div class="manager-name">${manager.player_name}</div>
        </div>
        <div class="align-right">
          ${manager.event_total}
        </div>
        <div class="align-right">
          ${manager.total}
        </div>
      </div>
    `);
  });
}

async function updateLeague() {
  const league = await getCurrentLeague();
  updateLeagueName(league);
  populateLeagueTable(league);
  showTableRows(1);
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
