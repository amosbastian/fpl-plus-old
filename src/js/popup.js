import '../css/main.scss';

document.addEventListener('DOMContentLoaded', () => {
  const links = Array.from(document.getElementsByTagName('a'));
  links.forEach((link) => {
    const location = link.href;
    link.onclick = () => chrome.tabs.create({ active: true, url: location });
  });
});
