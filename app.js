// Creating map with location and zoom level
const map = L.map('map').setView([51.574349, -1.310892], 17);

// Using open street map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Add diamond attribution
map.attributionControl.addAttribution('&copy; <a href="https://www.diamond.ac.uk">Diamond Light Source</a>')

// Defining our overlay image NE and SW bounds
const topRightCoords = [51.57168183170403, -1.3173294067382815]
const bottomRightCoords = [51.57701619673675, -1.304454803466797]
const imageBounds = new L.LatLngBounds(topRightCoords, bottomRightCoords);

// Drawing our overlay
new L.ImageOverlay("img/BaseUnder.png", imageBounds, {
  opacity: 1,
  zIndex: 1
}).addTo(map)

new L.ImageOverlay("img/BaseOver.png", imageBounds, {
  opacity: 1,
  zIndex: 2,
}).addTo(map)

let markers = [];

// Fetching data from json
fetch("beamlines_data.json")
  .then((result) => result.json())
  .then((groups) => {
    let overlays = {};

    for (const group of groups) {
      let layerGroup = L.layerGroup();

      for (const beamline of group["beamlines"]) {
        const marker = L.marker(beamline["position"]).addTo(layerGroup);
        marker.bindPopup(
          `<h1>${beamline.name}</h1>
          <p>${beamline.description}</p>
          <a href="${beamline.url}" target="_blank">More info</a>`
        );
        markers.push(marker); // Add marker to the array
      }

      layerGroup.addTo(map);
      overlays[group.name] = layerGroup;
    }

    L.control.layers(null, overlays).addTo(map);
  });

// Adding logic to mark users location

// Create a marker for the user's location with a predefined option, but don't add it to the map yet
let userLocationMarker = L.circle([0, 0], {
  radius: 3,
  fillColor: "#00f",
  color: "#00f",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
});

let userLocation;

// Begin watching user's location
map.locate({ watch: true });

// Once location is found, move the marker to that location and add it to the map
map.on('locationfound', function (e) {
  userLocationMarker.setLatLng(e.latlng);
  userLocation = e.latlng; // Store user's location
  if (!map.hasLayer(userLocationMarker)) {
    userLocationMarker.addTo(map);
  }
});

// Adding a "Find Closest Marker" button
let closestButton = L.control({position: 'topright'}); // Creates a control in the top right

closestButton.onAdd = function () {
  let div = L.DomUtil.create('div', 'closest-button');
  div.innerHTML = "<button id='findClosest'>Find Closest Marker</button>";

  // Adding event listener here
  div.firstChild.addEventListener('click', function(event) {
    L.DomEvent.stopPropagation(event); // Preventing the click event from propagating the closing the popup

    if (!userLocation) { // If we don't have the user location yet, don't try
      return;
    }

    let closestMarker;
    let shortestDistance = Number.MAX_SAFE_INTEGER;

    // Finding the closest marker to the users location
    for (const marker of markers) {
      // Check if the marker's layer is currently enabled
      if (!map.hasLayer(marker)) {
        continue
      }

      let distance = marker.getLatLng().distanceTo(userLocation);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        closestMarker = marker;
      }
    }

    // If we have found the closest marker, open it as a popup
    if (closestMarker) {
      closestMarker.openPopup();
    }
  });

  return div;
};

closestButton.addTo(map);
