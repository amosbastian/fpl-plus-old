import '../css/main.scss';
import { showPage, getCurrentPage, getPreviousPage } from './fpl';

// Default back
function back() {
  showPage('main-overview');
}

// For pages accessible from anywhere
async function backToPrevious() {
  let previousPage = await getPreviousPage();
  const currentPage = await getCurrentPage();
  if (previousPage === currentPage) {
    previousPage = 'main-overview';
  }
  showPage(previousPage);
}

/**
 * If the user has used the extension before then they are taken to the login page, otherwise they
 * are shown the feature page.
 */
function handleLoggedOutUser() {
  chrome.storage.local.get('newInstallation', (installationData) => {
    if (installationData.newInstallation) {
      showPage('features-overview');
      chrome.storage.local.set({ newInstallation: false });
    } else {
      showPage('login-overview');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.querySelectorAll('.back-button');
  backButton.forEach(button => button.addEventListener('click', back));

  const previousButtons = document.querySelectorAll('.back-button-previous');
  previousButtons.forEach(button => button.addEventListener('click', backToPrevious));
});

window.onload = async () => {
  // Set page to what it was before closing the popup.
  try {
    const currentPage = await getCurrentPage();
    showPage(currentPage);
  } catch (error) {
    handleLoggedOutUser();
  }
};
