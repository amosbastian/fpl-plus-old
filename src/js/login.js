import '../css/main.scss';
import {
  getUserHistory, getUserPicks, getUser, getCurrentGameweek,
} from './fpl';

function setLoginButton() {
  const loginButton = document.getElementById('fpl-login-button');

  if (this.value.length > 0) {
    loginButton.classList.remove('fpl-login-button--disabled');
  } else if (this.value.length === 0) {
    loginButton.classList.add('fpl-login-button--disabled');
  }
}

async function login() {
  const userId = document.getElementById('fpl-login-input').value;
  const currentGameweek = await getCurrentGameweek();
  const user = await getUser(userId);
  const picks = await getUserPicks(userId, currentGameweek);
  const history = await getUserHistory(userId);

  user.picks = picks;
  user.history = history;

  chrome.storage.local.set({ user });
  chrome.storage.local.set({ loggedIn: true });

  chrome.browserAction.setPopup({ popup: 'index.html' });
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginInput = document.getElementById('fpl-login-input');
  loginInput.addEventListener('input', setLoginButton);

  const loginButton = document.getElementById('fpl-login-button');
  loginButton.addEventListener('click', login);
});
