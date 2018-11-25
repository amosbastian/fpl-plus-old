import '../css/main.scss';

document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.getElementsByTagName('a'));
  links.forEach((link) => {
    const location = link.href;
    link.onclick = () => chrome.tabs.create({ active: true, url: location });
  });
});

function login() {
  const email = document.getElementById('fpl-email').value;
  const password = document.getElementById('fpl-password').value;
  console.log(email, password);
}

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('fpl-login');
  loginButton.onclick = login;
});
