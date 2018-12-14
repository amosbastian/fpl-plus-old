import '../css/main.scss';
import { showPage } from './fpl';

function toLogin() {
  showPage('login-overview');
}

document.addEventListener('DOMContentLoaded', () => {
  const featureButton = document.getElementById('fpl-feature-button');
  featureButton.addEventListener('click', toLogin);
});
