import '../css/main.scss';
import { getLocalUser } from './fpl';

const leagueTriangles = Array.from(document.getElementsByClassName('icon-triangle-right leagues'));
const leagueTableHeader = `
  <div class="fpl-league-table-row fpl-league-table-row--header">
    <div>
      League
    </div>
    <span></span>
    <div>
      Rank
    </div>
  </div>
`;

const leagueTablePagination = `
  <div class="pagination-wrapper">
  <div class="fpl-league-table-pagination">
    <div class="fpl-pagination-button previous-page"><span class="icon-triangle-left"></span></div>
    <div class="fpl-pagination-button next-page"><span class="icon-triangle-right"></span></div>
  </div>
  </div>
`;


function back() {
  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

/**
 * Returns an array of maxLength (or less) page numbers where a 0 in the returned array denotes a
 * gap in the series.
 *
 * Idea taken from: https://stackoverflow.com/a/46385144/4255859
 * @param {number} totalLeagues
 * @param {number} page
 * @param {number} maxLength
 */
function getPageList(totalLeagues, page, maxLength) {
  function range(start, end) {
    return Array.from(Array(end - start + 1), (_, i) => i + start);
  }

  const sideWidth = maxLength < 9 ? 1 : 2;
  const leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
  const rightWidth = (maxLength - sideWidth * 2 - 2) >> 1;

  // No ...
  if (totalLeagues <= maxLength) {
    return range(1, totalLeagues);
  }
  // No ... on left side
  if (page <= maxLength - sideWidth - 1 - rightWidth) {
    return range(1, maxLength - sideWidth - 1)
      .concat([0])
      .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
  }
  // No ... on right side
  if (page >= totalLeagues - sideWidth - 1 - rightWidth) {
    return range(1, sideWidth)
      .concat([0])
      .concat(range(totalLeagues - sideWidth - 1 - rightWidth - leftWidth, totalLeagues));
  }
  // ... on both sides
  return range(1, sideWidth)
    .concat([0])
    .concat(range(page - leftWidth, page + rightWidth))
    .concat([0])
    .concat(range(totalLeagues - sideWidth + 1, totalLeagues));
}
const limitPerPage = 5;
const paginationSize = 5;

function showTableRows(currentPage, leagueRows) {
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
 * @param {Node} paginationElement
 */
function updatePagination(currentPage, pageList, paginationElement) {
  const paginationContainer = paginationElement.parentElement;
  const paginationButtons = paginationContainer.getElementsByClassName('fpl-pagination-button');

  // Remove all buttons apart from the "previous" and "next" buttons
  Array.from(paginationButtons).slice(1, -1).forEach((button) => {
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
    paginationElement.insertAdjacentElement('beforebegin', paginationButton);
  });


  // Update CSS of previous and next buttons
  const previousButton = paginationContainer.getElementsByClassName('previous-page')[0];
  previousButton.classList.remove('disabled');
  const nextButton = paginationContainer.getElementsByClassName('next-page')[0];
  nextButton.classList.remove('disabled');

  if (currentPage === 1) {
    previousButton.classList.add('disabled');
  } else if (currentPage === paginationContainer.children.length) {
    nextButton.classList.add('disabled');
  }
}

/**
 * Shows the leagues of the given table and updates the league table's pagination.
 * @param {Node} button
 * @param {number} currentPage
 */
function showPage(button, currentPage = 0) {
  const whichPage = currentPage || parseInt(button.textContent, 10);
  const leagueRows = Array.from(button.parentElement.parentElement.previousElementSibling
    .getElementsByClassName('fpl-league-table-row--body'));
  const numberOfLeagues = leagueRows.length;
  const totalPages = Math.ceil(numberOfLeagues / limitPerPage);

  if (whichPage < 1 || whichPage > totalPages) return;

  showTableRows(whichPage, leagueRows);

  const pageList = getPageList(totalPages, whichPage, paginationSize);
  const paginationElement = button.parentElement.lastElementChild;
  updatePagination(whichPage, pageList, paginationElement);
}

/**
 * Initialises the league table's rows and its pagination element.
 * @param {Node} leagueTable
 */
function initialiseTable(leagueTable) {
  // Show the first 5 rows of the league table
  const leagueRows = Array.from(leagueTable.getElementsByClassName('fpl-league-table-row--body'));
  showTableRows(1, leagueRows);

  const numberOfLeagues = leagueRows.length;
  const totalLeagues = Math.ceil(numberOfLeagues / limitPerPage);
  const pageList = getPageList(totalLeagues, 1, paginationSize);

  // Get the "next" pagination button
  const paginationElement = leagueTable.nextElementSibling.firstElementChild.lastElementChild;
  updatePagination(1, pageList, paginationElement);
}

function paginationClickHandler(event) {
  if (!event.srcElement.classList.contains('fpl-pagination-button--number')
    || event.srcElement.textContent === '...') {
    return;
  }
  showPage(event.srcElement);
}

/**
 * Shows a table of all leagues a user is participating in.
 */
function showLeagueTable() {
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.remove('active');
    return;
  }

  // User is not participating in one of these leagues, so don't show the table
  if (this.classList.contains('triangle-disabled')) {
    return;
  }

  // Dropdown triangles
  leagueTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  const leagueTables = Array.from(document.getElementsByClassName('fpl-league-table-container'));
  leagueTables.forEach(leagueTable => leagueTable.classList.remove('active'));
  this.parentElement.nextElementSibling.classList.toggle('active');

  // Initialise private classic league table by default
  initialiseTable(this.parentElement.nextElementSibling.getElementsByClassName('fpl-league-table')[0]);
}

/**
 * Changes the league table's page depending on if the "previous" or "next" button is clicked.
 */
function changePage() {
  if (this.classList.contains('disabled')) return;
  const currentPage = this.parentElement.getElementsByClassName('active')[0].textContent;
  const change = this.classList.contains('previous-page') ? -1 : 1;

  showPage(this.parentElement.lastElementChild, parseInt(currentPage, 10) + change);
}

/**
 * Populates the league table with the given `leagueType` with the given leagues.
 * @param {Array<Object>} leagues
 * @param {string} leagueType
 */
function populateLeagueTable(leagues, leagueType) {
  const leagueHeader = document.getElementById(leagueType);

  // Main container
  const leagueTableContainer = document.createElement('div');
  leagueTableContainer.className = `fpl-league-table-container ${leagueType === 'private-classic' ? 'active' : ''}`;

  // League table container
  const leagueTableElement = document.createElement('div');
  leagueTableElement.className = 'fpl-league-table';
  leagueTableElement.id = 'private-classic-league-table';
  leagueTableElement.insertAdjacentHTML('afterbegin', leagueTableHeader);

  // League table body
  const leagueTableBody = document.createElement('div');
  leagueTableBody.className = 'fpl-league-table-body';

  // Create each row of the table and insert into the body
  leagues.forEach((league) => {
    const leagueTableRow = document.createElement('div');

    let rankChange = '<span class="icon-triangle-up"></span>';
    if (league.entry_movement === 'down') {
      rankChange = '<span class="icon-triangle-down"></span>';
    } else if (league.entry_movement === 'same') {
      rankChange = '<span><div class="icon-circle"></div></span>';
    }

    leagueTableRow.className = 'fpl-league-table-row fpl-league-table-row--body hidden';
    leagueTableRow.insertAdjacentHTML('beforeend', `<div>${league.name}</div>`);
    leagueTableRow.insertAdjacentHTML('beforeend', rankChange);
    leagueTableRow.insertAdjacentHTML('beforeend', `<div>${league.entry_rank}</div>`);
    leagueTableBody.insertAdjacentElement('beforeend', leagueTableRow);
  });

  // Create the entire element and insert
  leagueTableElement.insertAdjacentElement('beforeend', leagueTableBody);
  leagueTableContainer.insertAdjacentHTML('beforeend', leagueTablePagination);
  leagueTableContainer.insertAdjacentElement('afterbegin', leagueTableElement);
  leagueHeader.insertAdjacentElement('afterend', leagueTableContainer);
}

async function populateLeagues() {
  const user = await getLocalUser();

  // Private classic
  const privateClassicLeagues = user.leagues.classic.filter(league => league.league_type === 'x');
  if (privateClassicLeagues.length > 0) populateLeagueTable(privateClassicLeagues, 'private-classic');

  // Private H2H
  const privateH2HLeagues = user.leagues.h2h.filter(league => league.league_type === 'x');
  if (privateH2HLeagues.length > 0) populateLeagueTable(privateH2HLeagues, 'private-h2h');

  // Public H2H
  const publicH2HLeagues = user.leagues.h2h.filter(league => league.league_type === 'c');
  if (publicH2HLeagues.length > 0) populateLeagueTable(publicH2HLeagues, 'public-h2h');

  // Global
  const globalLeagues = user.leagues.classic.filter(league => league.league_type === 's');
  if (globalLeagues.length > 0) populateLeagueTable(globalLeagues, 'global');

  // Show private classic league table by default
  const privateClassicTable = document.getElementById('private-classic-league-table');
  initialiseTable(privateClassicTable);

  const paginationElement = document.getElementsByClassName('fpl-league-table-pagination')[0];
  paginationElement.addEventListener('click', event => paginationClickHandler(event));

  const previousButtons = Array.from(document.getElementsByClassName('fpl-pagination-button previous-page'));
  previousButtons.forEach(button => button.addEventListener('click', changePage));

  const nextButtons = Array.from(document.getElementsByClassName('fpl-pagination-button next-page'));
  nextButtons.forEach(button => button.addEventListener('click', changePage));
}


document.addEventListener('DOMContentLoaded', () => {
  populateLeagues();

  const backButton = document.getElementById('back');
  backButton.addEventListener('click', back);

  setTimeout(() => {
    leagueTriangles.forEach((triangle) => {
      triangle.addEventListener('click', showLeagueTable);

      // User not participating in this type of league so disable the button
      if (triangle.parentElement.nextElementSibling.classList.contains('fpl-league')) {
        triangle.classList.add('triangle-disabled');
      }
    });
  }, 100);
});
