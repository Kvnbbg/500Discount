// Description: JavaScript file for the interactive car dashboard
// Link this script to the settings.html file

function createPopup(emojiContent) {
    var popup = document.createElement("div");
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

    var text = document.createTextNode(emojiContent);
    popup.appendChild(text);

    document.body.appendChild(popup);

    // Add attention-seeking animation
    anime({
        targets: popup,
        scale: [0.1, 1.0],
        duration: 1000,
        easing: 'easeInOutQuad',
        complete: function(anim) {
            setTimeout(function() {
                popup.remove();
            }, 1000);
        }
    });
}

// Add event listeners to the navigation buttons
['left', 'right', 'up', 'down'].forEach(function(direction) {
    document.getElementById(direction).addEventListener('click', function(event) {
        createPopup(faker.random.arrayElement(["💰🎟️🎫🛒💸", "🚗🚕🚙🚌🚎", "🚦🚥🚧🛑🚏", "🚓🚔🚒🚑🚐"]));
    });
});

// Description: Fetch car information from API and update #car-info section
// Link this script to the settings.html file
const carInfoSection = document.getElementById('car-info');

// Ask the user for a car model
var userInput = prompt("Please enter a car model, or leave blank to use a public customized car:");

// Simulate loading bar
var loadingBar = document.createElement("div");
loadingBar.style.position = "fixed";
loadingBar.style.top = "0";
loadingBar.style.left = "0";
loadingBar.style.height = "4px";
loadingBar.style.width = "0";
loadingBar.style.backgroundColor = "#007bff";
loadingBar.style.transition = "width 5s ease-in-out";
document.body.appendChild(loadingBar);

setTimeout(function() {
    loadingBar.style.width = "100%";
}, 100);

setTimeout(function() {
    loadingBar.remove();
}, 5000);

// Simulate fetching data from API
setTimeout(function() {
    // Arrays of car models, years, and battery health statuses
    var models = ["CustomCar 1", "CustomCar 2", "CustomCar 3", "CustomCar 4"];
    if (userInput) {
        models.push(userInput);
    }
    var years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
    var batteryHealths = ["Good", "Fair", "Poor", "Excellent", "New", "Used"];
    var faker = require('faker');

    // Select a random model, year, and battery health
    var model = models[Math.floor(Math.random() * models.length)];
    var year = years[Math.floor(Math.random() * years.length)];
    var batteryHealth = batteryHealths[Math.floor(Math.random() * batteryHealths.length)];

    carInfoSection.innerHTML = `
        <h2>Car ID</h2>
        <p>Carbon Footprint: ${faker.random.number({min: 1, max: 100})} kg CO2</p>
        <p>License Plate: ${faker.random.alphaNumeric(8)}</p>
        <p>Model: ${model}</p>
        <p>Year: ${year}</p>
        <p>Battery Health: ${batteryHealth}</p>
        <p>Carburetor: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
        <p>Engine: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
        <p>Transmission: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
        <p>Brakes: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
        <p>Steering: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
        <p>Exhaust: ${faker.random.arrayElement(["Good", "Fair", "Poor", "Excellent", "New", "Used"])}</p>
    `;
}, 5000);

document.addEventListener('DOMContentLoaded', (event) => {
    // Get the statistics elements
    const usersElement = document.getElementById('users');
    const carsElement = document.getElementById('cars');
    const themesElement = document.getElementById('themes');

    // Generate random data
    const users = Math.floor(Math.pow(Math.random() * 10, 2));
    const cars = Math.floor(Math.pow(Math.random() * 10, 2));
    const themes = Math.floor(Math.pow(Math.random() * 10, 2));

    // Update the statistics elements
    usersElement.textContent = users;
    carsElement.textContent = cars;
    themesElement.textContent = themes;
});

document.addEventListener('DOMContentLoaded', (event) => {
    const models = ["CustomCar 1", "CustomCar 2", "CustomCar 3", "CustomCar 4"];
    const years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];
    const batteryHealths = ["Good", "Fair", "Poor", "Excellent", "New", "Used"];
    const carInfoSection = document.getElementById('car-info');
    const loadingBar = createLoadingBar();

    // Ask the user for a car model
    var userInput = prompt("Please enter a car model, or leave blank to use a public customized car:");
    if (userInput) {
        models.push(userInput);
    }

    // Simulate loading bar
    loadingBar.style.width = "100%";
    setTimeout(() => {
        loadingBar.remove();
    }, 5000);

    // Simulate fetching data from API
    setTimeout(() => {
        // Select a random model, year, and battery health
        var model = models[Math.floor(Math.random() * models.length)];
        var year = years[Math.floor(Math.random() * years.length)];
        var batteryHealth = batteryHealths[Math.floor(Math.random() * batteryHealths.length)];

        carInfoSection.innerHTML = `
            <h2>Car Information</h2>
            <p>Model: ${model}</p>
            <p>Year: ${year}</p>
            <p>Battery Health: ${batteryHealth}</p>
        `;
    }, 5000);
});

function createLoadingBar() {
    var loadingBar = document.createElement("div");
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
// Function to handle click event on myButton
function handleClick() {
    // Get the myDiv element
    var myDiv = document.getElementById('myDiv');
    
    // Toggle the display of myDiv
    if (myDiv.style.display === 'none') {
        myDiv.style.display = 'block';
    } else {
        myDiv.style.display = 'none';
    }
}

// Add event listener to myButton
document.getElementById('myButton').addEventListener('click', handleClick);

function toggleDropdown(id) {
    var dropdown = document.getElementById(id);
    dropdown.classList.toggle("show");
  }

  // Close the dropdown menu if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.my-element')) {
      var dropdowns = document.getElementsByClassName("dropdown-menu");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }