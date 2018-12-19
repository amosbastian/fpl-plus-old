import '../css/main.scss';
import { showPage, getCurrentPage } from './fpl';

function back() {
  showPage('main-overview');
}

function backToLeaguesOverview() {
  showPage('leagues-overview');
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

  const leagueBackButton = document.querySelector('.back-button-league');
  leagueBackButton.addEventListener('click', backToLeaguesOverview);
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
