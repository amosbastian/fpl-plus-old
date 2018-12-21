import '../css/main.scss';

/**
 * Shows a table of all leagues a user is participating in.
 */
function showFixtures() {
  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.add('hidden');
    return;
  }

  // Dropdown triangles
  fixtureTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');

  const fixtureContainers = Array.from(document.getElementsByClassName('fixtures-container'));
  fixtureContainers.forEach(container => container.classList.add('hidden'));

  const currentContainer = this.parentElement.nextElementSibling;
  currentContainer.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  fixtureTriangles.forEach((triangle) => {
    triangle.addEventListener('click', showFixtures);
  });
});
