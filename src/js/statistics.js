import '../css/main.scss';
import {
  getPlayers, getTeamToFixtures, getTeams, getPageList,
} from './fpl';

let allPlayers = [];
async function loadPlayers() {
  allPlayers = await getPlayers();
}
loadPlayers();

let teamToFixtures = [];
async function loadTeamToFixtures() {
  teamToFixtures = await getTeamToFixtures();
}
loadTeamToFixtures();

let allTeams = [];
async function loadTeams() {
  allTeams = await getTeams();
}
loadTeams();

const limitPerPage = 8;
const paginationSize = 5;

const playerType = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const paginationElement = document.getElementById('player-table-pagination');
const previousButton = document.getElementById('player-table-previous');
const nextButton = document.getElementById('player-table-next');
const filterSelect = document.getElementById('fpl-player-filter');
const sortSelect = document.getElementById('fpl-player-sort');

/**
 * Returns the FDR element showing each player's FDR over the next 5 games.
 * @param {Array<Object>} fixtures
 */
function getFDRElement(fixtures) {
  let FDRSquares = '';
  fixtures.forEach((fixture) => {
    const FDRTitle = `${fixture.opponent_short_name} (${fixture.is_home ? 'H' : 'A'})`;
    FDRSquares += `<div class="fixture-square-table fdr--${fixture.difficulty}" title="${FDRTitle}"></div>`;
  });
  return `
    <div class="fdr-table">
      ${FDRSquares}
    </div>
  `;
}

/**
 * Shows certain rows of the player table depending on the given page number and the limit per page.
 * @param {number} currentPage
 */
function showTableRows(currentPage) {
  const tableRows = Array.from(document.getElementsByClassName('fpl-player-table-row--body'));
  tableRows.forEach((tableRow) => {
    tableRow.classList.add('hidden');
  });

  tableRows.slice((currentPage - 1) * limitPerPage, currentPage * limitPerPage)
    .forEach((tableRow) => {
      tableRow.classList.remove('hidden');
    });
}

/**
 * Updates the table's pagination by inserting new pagination buttons before the "next"
 * button.
 * @param {number} currentPage
 * @param {Array<number>} pageList
 */
function updatePagination(currentPage, pageList) {
  const paginationContainer = document.getElementById('player-table-pagination');
  const paginationButtons = Array.from(paginationContainer.getElementsByClassName('fpl-pagination-button'));

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
  const numberOfPlayers = Array.from(document.getElementsByClassName('fpl-player-table-row--body')).length;

  if (currentPage === 1) {
    previousButton.classList.add('disabled');
  } else if (currentPage === Math.ceil(numberOfPlayers / limitPerPage)) {
    nextButton.classList.add('disabled');
  }
}

/**
 * Updates the player table with the players that should be shown, and updates the pagination.
 * @param {number} currentPage
 */
function updatePlayerTable(currentPage) {
  const tableRows = Array.from(document.getElementsByClassName('fpl-player-table-row--body'));
  const totalPages = Math.ceil(tableRows.length / limitPerPage);
  if (currentPage < 1 || currentPage > totalPages) return;
  showTableRows(currentPage);

  const pageList = getPageList(totalPages, currentPage, paginationSize);
  updatePagination(currentPage, pageList);
}

async function getFilteredPlayers(playerPosition = 'all', playerTeam = 'all', playerAttribute = 'all') {
  if (allPlayers.length === 0) {
    allPlayers = await getPlayers();
  }
  const attribute = (playerAttribute === 'all') ? 'total_points' : playerAttribute;
  const sortedPlayers = allPlayers.sort(
    (a, b) => (a[attribute] === b[attribute] ? 0 : +(a[attribute] > b[attribute]) || -1),
  );

  const positions = (playerPosition === 'all') ? [1, 2, 3, 4] : [playerPosition];
  const teams = (playerTeam === 'all') ? Array(20).fill().map((x, i) => i + 1) : [playerTeam];
  const filteredPlayers = sortedPlayers
    .filter(player => positions.includes(player.element_type) && teams.includes(player.team));

  return filteredPlayers;
}

/**
 * Populates the player table with all players.
 */
async function populatePlayerTable(playerPosition = 'all', playerTeam = 'all', playerAttribute = 'all') {
  const players = await getFilteredPlayers(playerPosition, playerTeam, playerAttribute);
  const playerTable = document.getElementById('player-table');
  const attribute = (playerAttribute === 'all') ? 'total_points' : playerAttribute;

  // Remove previously loaded player table.
  while (playerTable.firstChild) {
    playerTable.removeChild(playerTable.firstChild);
  }

  players.reverse().forEach((player) => {
    const teamName = allTeams.find(team => team.id === player.team).short_name;
    const fixtures = teamToFixtures[teamName];
    const FDRElement = getFDRElement(fixtures);
    playerTable.insertAdjacentHTML('beforeend', `
      <div class="fpl-player-table-row fpl-player-table-row--body">
        <div class="team-badge ${teamName}"></div>
        <div>${player.web_name}</div>
        <div>${playerType[player.element_type]}</div>
        ${FDRElement}
        <div class="fpl-team-table-points">
          ${player[attribute]}
        </div>
      </div>
    `);
  });
}

async function updateStatistics(playerPosition = 'all', playerTeam = 'all', playerAttribute = 'all') {
  await populatePlayerTable(playerPosition, playerTeam, playerAttribute);
  updatePlayerTable(1);
}

function changePage() {
  if (this.classList.contains('disabled')) return;
  const currentPage = paginationElement.getElementsByClassName('active')[0].textContent;
  const change = this.classList.contains('previous-page') ? -1 : 1;

  updatePlayerTable(parseInt(currentPage, 10) + change);
}

function paginationClickHandler(event) {
  if (!event.srcElement.classList.contains('fpl-pagination-button--number')
    || event.srcElement.textContent === '...') {
    return;
  }
  updatePlayerTable(parseInt(event.srcElement.textContent, 10));
}

function filterPlayers() {
  const filterValue = filterSelect[filterSelect.selectedIndex].value;
  const positions = filterValue.includes('position') ? parseInt(filterValue.split('-')[1], 10) : 'all';
  const teams = filterValue.includes('team') ? parseInt(filterValue.split('-')[1], 10) : 'all';
  const sortValue = sortSelect[sortSelect.selectedIndex].value;
  updateStatistics(positions, teams, sortValue);
}

async function populatefilterSelect() {
  if (allTeams.length === 0) {
    allTeams = await getTeams();
  }
  const byTeamGroup = filterSelect.lastElementChild;
  allTeams.forEach((team) => {
    byTeamGroup.insertAdjacentHTML('beforeend', `
      <option value="team-${team.id}">${team.name}</option>
    `);
  });

  filterSelect.parentElement.addEventListener('change', filterPlayers);
}

/**
 * Observe changes of the statistics overview element's style (display: none -> grid).
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.oldValue === null || mutation.oldValue === 'display: none;') {
      updateStatistics();
    }
  });
});
observer.observe(document.getElementById('statistics-overview'), {
  attributes: true,
  attributeFilter: ['style'],
  attributeOldValue: true,
});

document.addEventListener('DOMContentLoaded', () => {
  populatefilterSelect();
  paginationElement.addEventListener('click', event => paginationClickHandler(event));
  [previousButton, nextButton].forEach(button => button.addEventListener('click', changePage));
});
