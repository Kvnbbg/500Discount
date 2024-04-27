// script.js

document.getElementById('left').addEventListener('click', function(event) {
    // Handle left navigation
});

document.getElementById('right').addEventListener('click', function(event) {
    // Handle right navigation
});

document.getElementById('up').addEventListener('click', function(event) {
    // Handle up navigation
});

document.getElementById('down').addEventListener('click', function(event) {
    // Handle down navigation
});


// Example: Fetch car information from API and update #car-info section
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


document.getElementById("myButton").addEventListener("click", function() {
    alert("Vous avez cliqué sur le bouton !");
});
