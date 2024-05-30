// script.js

document.addEventListener('DOMContentLoaded', (event) => {
  // Generate and display random statistics
  updateStatistics();
  
  // Fetch car information and update car-info section
  fetchCarInformation();

  // Add event listeners for controls
  addControlEventListeners();
});

function updateStatistics() {
  const usersElement = document.getElementById('users');
  const carsElement = document.getElementById('cars');
  const themesElement = document.getElementById('themes');
  const sessionsElement = document.getElementById('sessions');
  const customizationsElement = document.getElementById('customizations');

  const users = Math.floor(Math.pow(Math.random() * 10, 2));
  const cars = Math.floor(Math.pow(Math.random() * 10, 2));
  const themes = Math.floor(Math.pow(Math.random() * 10, 2));
  const sessions = Math.floor(Math.random() * 100);
  const customizations = Math.floor(Math.random() * 1000);

  usersElement.textContent = users;
  carsElement.textContent = cars;
  themesElement.textContent = themes;
  sessionsElement.textContent = sessions;
  customizationsElement.textContent = customizations;
}

function fetchCarInformation() {
  const carInfoSection = document.getElementById('car-info');

  const models = ["CustomCar 1", "CustomCar 2", "CustomCar 3", "CustomCar 4"];
  const years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
  const batteryHealths = ["Good", "Fair", "Poor", "Excellent", "New", "Used"];

  const userInput = prompt("Please enter a car model, or leave blank to use a public customized car:");
  if (userInput) {
    models.push(userInput);
  }

  const loadingBar = createLoadingBar();

  setTimeout(() => {
    loadingBar.style.width = "100%";
  }, 100);

  setTimeout(() => {
    loadingBar.remove();

    const model = models[Math.floor(Math.random() * models.length)];
    const year = years[Math.floor(Math.random() * years.length)];
    const batteryHealth = batteryHealths[Math.floor(Math.random() * batteryHealths.length)];

    carInfoSection.innerHTML = `
      <h2>Vehicle Information</h2>
      <p>Model: ${model}</p>
      <p>Year: ${year}</p>
      <p>Battery Health: ${batteryHealth}</p>
      <p>Mileage: 45,000 miles</p>
      <p>Last Service Date: March 2024</p>
    `;
  }, 5000);
}

function createLoadingBar() {
  const loadingBar = document.createElement("div");
  loadingBar.style.position = "fixed";
  loadingBar.style.top = "0";
  loadingBar.style.left = "0";
  loadingBar.style.height = "4px";
  loadingBar.style.width = "0";
  loadingBar.style.backgroundColor = "#007bff";
  loadingBar.style.transition = "width 5s ease-in-out";
  document.body.appendChild(loadingBar);
  return loadingBar;
}

function addControlEventListeners() {
  ['left', 'right', 'up', 'down', 'start', 'stop'].forEach(direction => {
    document.getElementById(direction).addEventListener('click', event => {
      createPopup(faker.random.arrayElement(["💰🎟️🎫🛒💸", "🚗🚕🚙🚌🚎", "🚦🚥🚧🛑🚏", "🚓🚔🚒🚑🚐"]));
    });
  });
}

function createPopup(emojiContent) {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.width = "200px";
  popup.style.height = "200px";
  popup.style.backgroundColor = "#fff";
  popup.style.border = "1px solid #000";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "20px";
  popup.style.textAlign = "center";
  popup.style.zIndex = "1000";

  const text = document.createTextNode(emojiContent);
  popup.appendChild(text);

  document.body.appendChild(popup);

  anime({
    targets: popup,
    scale: [0.1, 1.0],
    duration: 1000,
    easing: 'easeInOutQuad',
    complete: () => {
      setTimeout(() => {
        popup.remove();
      }, 1000);
    }
  });
}
