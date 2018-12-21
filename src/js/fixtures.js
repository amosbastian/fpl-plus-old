import '../css/main.scss';

/**
 * Shows a table of all leagues a user is participating in.
 */
function showFixtures() {
  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  if (this.classList.contains('active')) {
    this.classList.remove('active');
    this.parentElement.nextElementSibling.classList.remove('active');
    return;
  }

  // Dropdown triangles
  fixtureTriangles.forEach(triangle => triangle.classList.remove('active'));
  this.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const fixtureTriangles = Array.from(document.getElementsByClassName('icon-triangle-right fixtures'));
  fixtureTriangles.forEach((triangle) => {
    triangle.addEventListener('click', showFixtures);
  });
});
