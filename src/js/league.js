import { getCurrentLeague, getPageList, getLocalUser } from './fpl';

const FPLSeason = ['August', 'September', 'October', 'November', 'December', 'January', 'February',
  'March', 'April', 'May'];

const limitPerPage = 7;
const paginationSize = 5;

function updateLeagueName(league) {
  const header = document.getElementById('league-overview').firstElementChild.lastElementChild;
  header.textContent = `${league.league.name}`;
}

/**
 * Shows certain rows of the league table depending on the given page number and the limit per page.
 * @param {number} currentPage
 */
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

/**
 * Updates the league table's pagination by inserting new pagination buttons before the "next"
 * button.
 * @param {number} currentPage
 * @param {Array<number>} pageList
 */
function updatePagination(currentPage, pageList) {
  const paginationContainer = document.getElementById('league-table-pagination');
  const paginationButtons = Array.from(paginationContainer.getElementsByClassName('fpl-pagination-button'));

  const nextButton = document.getElementById('league-table-next');
  const previousButton = document.getElementById('league-table-previous');

  // Remove all buttons apart from the "previous" and "next" buttons
  paginationButtons.slice(1, -1).forEach((button) => {
    button.remove();
  });

  pageList.forEach((page) => {
    const paginationButton = document.createElement('div');
    paginationButton.className = 'fpl-pagination-button fpl-pagination-button--number';

    if (page === currentPage) {
      paginationButton.classList.add('active');
    }

    // If page = 0, set content to "..." and disable
    paginationButton.textContent = page || '...';
    if (paginationButton.textContent === '...') {
      paginationButton.classList.add('non-number');
    }

    // Insert all pagination buttons before the "next" button
    nextButton.insertAdjacentElement('beforebegin', paginationButton);
  });


  // Update CSS of previous and next buttons
  previousButton.classList.remove('disabled');
  nextButton.classList.remove('disabled');

  if (currentPage === 1) {
    previousButton.classList.add('disabled');
  } else if (currentPage === paginationContainer.children.length + 1) {
    nextButton.classList.add('disabled');
  }
}

/**
 * Shows the leagues of the given table and updates the league table's pagination.
 * @param {Node} button
 * @param {number} currentPage
 */
function updateTable(currentPage) {
  const leagueRows = Array.from(document.getElementsByClassName('fpl-league-table-row--body'));
  const totalPages = Math.ceil(leagueRows.length / limitPerPage);
  if (currentPage < 1 || currentPage > totalPages) return;
  showTableRows(currentPage);

  const pageList = getPageList(totalPages, currentPage, paginationSize);
  updatePagination(currentPage, pageList);
}

function paginationClickHandler(event) {
  if (!event.srcElement.classList.contains('fpl-pagination-button--number')
    || event.srcElement.textContent === '...') {
    return;
  }
  updateTable(parseInt(event.srcElement.textContent, 10));
}

/**
 * Changes the league table's page depending on if the "previous" or "next" button is clicked.
 */
function changePage() {
  if (this.classList.contains('disabled')) return;
  const paginationElement = document.getElementById('league-table-pagination');
  const currentPage = paginationElement.getElementsByClassName('active')[0].textContent;
  const change = this.classList.contains('previous-page') ? -1 : 1;

  updateTable(parseInt(currentPage, 10) + change);
}

async function getManagerId() {
  const user = await getLocalUser();
  return user.entry.id;
}

function populateLeagueTable(league, managerId) {
  const leagueTable = document.getElementById('league-table');

  // Remove previously loaded league table.
  while (leagueTable.firstChild) {
    leagueTable.removeChild(leagueTable.firstChild);
  }

  const standings = league.standings.results;
  standings.forEach((manager) => {
    // Manager's rank change with regards to the league table.
    let rankChange = '<span class="icon-triangle-up movement-league movement-league--up">';
    if (manager.movement === 'down') {
      rankChange = '<span class="icon-triangle-down movement-league movement-league--down"></span>';
    } else if (manager.movement === 'same') {
      rankChange = '<span><div class="icon-circle movement-league movement-league--same"></div></span>';
    }

    let rowClass = 'fpl-league-table-row fpl-league-table-row--body';
    if (managerId === manager.entry) {
      rowClass += ' current-manager';
    }

    leagueTable.insertAdjacentHTML('beforeend', `
      <div class="${rowClass}">
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

  // Add event listeners for the pagination buttons.
  const paginationElement = document.getElementById('league-table-pagination');
  paginationElement.addEventListener('click', event => paginationClickHandler(event));

  const previousButton = document.getElementById('league-table-previous');
  previousButton.addEventListener('click', changePage);

  const nextButton = document.getElementById('league-table-next');
  nextButton.addEventListener('click', changePage);
}

async function updateLeague(phase = 1) {
  const league = await getCurrentLeague();
  const managerId = await getManagerId();

  updateLeagueName(league);
  populateLeagueTable(league, managerId);
  updateTable(phase);
}

/**
 * Observe changes of the league overview element's style (display: none -> grid).
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.oldValue === null || mutation.oldValue === 'display: none;') {
      updateLeague();
    }
  });
});
observer.observe(document.getElementById('league-overview'), {
  attributes: true,
  attributeFilter: ['style'],
  attributeOldValue: true,
});

function populateSelect() {
  const currentMonth = new Date().toLocaleString('en-us', { month: 'long' });
  const phaseSelect = document.getElementById('league-table-select');
  const phaseOptions = FPLSeason.slice(0, FPLSeason.indexOf(currentMonth) + 1);
  phaseOptions.unshift('Overall');

  phaseOptions.forEach((phase) => {
    const value = phaseOptions.indexOf(phase) + 1;
    phaseSelect.insertAdjacentHTML('beforeend', `
      <option value="${value}">${phase}</option>
    `);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateSelect();
});
