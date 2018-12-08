import '../css/main.scss';

function setLoginButton() {
  const loginButton = document.getElementById('fpl-login-button');

  if (this.value.length > 0) {
    loginButton.classList.remove('fpl-login-button--disabled');
  } else if (this.value.length === 0) {
    loginButton.classList.add('fpl-login-button--disabled');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginInput = document.getElementById('fpl-login-input');
  loginInput.addEventListener('input', setLoginButton);
});
