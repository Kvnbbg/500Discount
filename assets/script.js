// script.js

// Description: JavaScript file for the interactive car dashboard
// Link this script to the settings.html file

document.getElementById('left').addEventListener('click', function(event) {
    // Handle left navigation
    function left() {
        var x = document.getElementById("left");
        x.style.color = "red";
        // Create a new div
        var newDiv = document.createElement("div"); // Add some interactive text to the div
        var newContent = document.createTextNode("💰🎟️🎫🛒💸");
        newDiv.appendChild(newContent); // Add the new div to the image button
        var currentDiv = document.getElementById("myButton");
        document.body.insertBefore(newDiv, currentDiv);
      }
});

document.getElementById('right').addEventListener('click', function(event) {
    // Handle right navigation
    function right() {
        var x = document.getElementById("right");
        x.style.color = "green";
        var newDiv = document.createElement("div");
        var newContent = document.createTextNode("🚗🚕🚙🚌🚎");
        newDiv.appendChild(newContent);
        var currentDiv = document.getElementById("myButton");
        document.body.insertBefore(newDiv, currentDiv);
      }
});

document.getElementById('up').addEventListener('click', function(event) {
    // Handle up navigation
    function up() {
        var x = document.getElementById("up");
        x.style.color = "blue";
        var newDiv = document.createElement("div");
        var newContent = document.createTextNode("🚦🚥🚧🛑🚏");
        newDiv.appendChild(newContent);
        var currentDiv = document.getElementById("myButton");
        document.body.insertBefore(newDiv, currentDiv);
      }
});

document.getElementById('down').addEventListener('click', function(event) {
    // Handle down navigation
    function down() {
        var x = document.getElementById("down");
        x.style.color = "yellow";
        var newDiv = document.createElement("div");
        var newContent = document.createTextNode("🚓🚔🚒🚑🚐");
        newDiv.appendChild(newContent);
        var currentDiv = document.getElementById("myButton");
        document.body.insertBefore(newDiv, currentDiv);
      }
});


// Description: Fetch car information from API and update #car-info section
// Link this script to the settings.html file
const carInfoSection = document.getElementById('car-info');
fetch('car-api-url')
    .then(response => response.json())
    .then(data => {
        // Update car information section
        carInfoSection.innerHTML = `
            <h2>Car Information</h2>
            <p>Model: ${data.model}</p>
            <p>Year: ${data.year}</p>
            <p>Battery Health: ${data.batteryHealth}</p>
        `;
    })
    .catch(error => console.error('Error fetching car information:', error));
    