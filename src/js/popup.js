import '../css/main.scss';
import {
  getUser, getUserPicks, getUserHistory, getCurrentGameweek, getLocalUser,
} from './fpl';

document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.getElementsByTagName('a'));
  links.forEach((link) => {
    const location = link.href;
    link.onclick = () => chrome.tabs.create({ active: true, url: location });
  });
});

async function updateWelcomePage() {
  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'grid';

  const user = await getLocalUser();
  document.getElementById('username').textContent = `${user.entry.player_first_name}
    ${user.entry.player_last_name}`;
  document.getElementById('team-name').textContent = user.entry.name;
  document.getElementById('overall-points').textContent = user.entry.summary_overall_points;
  document.getElementById('overall-rank').textContent = user.entry.summary_overall_rank;
  document.getElementById('gameweek-points').textContent = user.entry.summary_event_points;
  document.getElementById('gameweek-rank').textContent = user.entry.summary_event_rank;
}

function showWelcomePage() {
  const loginDiv = document.getElementById('login');
  loginDiv.style.display = 'none';
  const welcomePage = document.getElementById('welcome');
  welcomePage.style.display = 'grid';

  updateWelcomePage();
}

async function login() {
  const userId = document.getElementById('fpl-user-id').value;
  const currentGameweek = await getCurrentGameweek();
  const user = await getUser(userId);
  const picks = await getUserPicks(userId, currentGameweek);
  const history = await getUserHistory(userId);

  user.picks = picks;
  user.history = history;

  chrome.storage.local.set({ user });
  chrome.storage.local.set({ loggedIn: true });

  showWelcomePage();
}

async function logout() {
  const welcomePage = document.getElementById('welcome');
  const loginDiv = document.getElementById('login');
  chrome.storage.local.set({ loggedIn: false }, () => {
    welcomePage.style.display = 'none';
    loginDiv.style.display = 'grid';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('fpl-login');
  loginButton.onclick = login;
  const logoutButton = document.getElementById('fpl-logout');
  logoutButton.onclick = logout;

  chrome.storage.local.get(['loggedIn'], (data) => {
    if (data.loggedIn) {
      showWelcomePage();
    }
  });
});
