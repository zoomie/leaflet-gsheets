/* global L Tabletop */

/*
 * Script to display two tables from Google Sheets as point and polygon layers using Leaflet
 * The Sheets are then imported using Tabletop.js and overwrite the initially laded layers
 */

// init() is called as soon as the page loads
function init() {
  var pointsURL = 
    "https://docs.google.com/spreadsheets/d/1jBndsqchkcmiYXSIMU6U72jIQG5FId7mVMbrHJitAlI/edit?usp=sharing";
  Tabletop.init({ key: pointsURL, callback: addPoints, simpleSheet: true }); // simpleSheet assumes there is only one table and automatically sends its data
}
window.addEventListener("DOMContentLoaded", init);

// Create a new Leaflet map centered on st francis bay
var map = L.map("map").setView([-34.17500, 24.8300], 13);

// This is the Carto Positron basemap
var basemap = L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='http://cartodb.com/attributions'>CartoDB</a>",
    subdomains: "abcd",
    maxZoom: 19
  }
);
basemap.addTo(map);

var sidebar = L.control
  .sidebar({
    container: "sidebar",
    closeButton: true,
    position: "right"
  })
  .addTo(map);

let panelID = "my-info-panel";
var panelContent = {
  id: panelID,
  tab: "<i class='fa fa-bars active'></i>",
  pane: "<p id='sidebar-content'></p>",
  title: "<h2 id='sidebar-title'>No property selected</h2>"
};
sidebar.addPanel(panelContent);

map.on("click", function() {
  sidebar.close(panelID);
});


// These are declared outisde the functions so that the functions can check if they already exist
var pointGroupLayer;

function addPoints(data) {
  if (pointGroupLayer != null) {
    pointGroupLayer.remove();
  }
  pointGroupLayer = L.layerGroup().addTo(map);

  data = filter_by_ids(data, document.URL)

  for (var row = 0; row < data.length; row++) {
    var marker = L.marker([data[row].lat, data[row].lon]);
    marker.addTo(pointGroupLayer);

    marker.feature = {
      properties: {
        price: data[row].price,
        address: data[row].address,
        link_to_pgp: data[row].link_to_pgp,
        link_to_google_maps: data[row].link_to_google_maps
      }
    };
    marker.on({
      click: function(e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById("sidebar-title").innerHTML =
          e.target.feature.properties.price;
        display_sidebar_content(document.getElementById("sidebar-content"),
                                e.target.feature.properties);
        sidebar.open(panelID);
      }
    });

    // AwesomeMarkers is used to create fancier icons
    var icon = L.AwesomeMarkers.icon({
      icon: "info-sign",
      iconColor: "white",
      markerColor: getColor(data[row].property_type),
      prefix: "glyphicon",
      extraClasses: "fa-rotate-0"
    });
    marker.setIcon(icon);
  }
}

function filter_by_ids(data, url) {
  var splitUrl = url.split("?") 
  if (splitUrl.length == 1) {
    return data
  }
  var idsToDisplay = splitUrl[1].split("=")[1].split(",")
  var newData = []
  for (var row = 0; row < data.length; row++) {
    if (idsToDisplay.includes(data[row].primary_id)) {
      newData.push(data[row])
    }
  }
  return newData
}

function display_sidebar_content(sidebar, properties) {

  var divContainer = document.getElementById("div-container") 
  if (!divContainer) {
    var divContainer = document.createElement("div")
    divContainer.id = "div-container"
    sidebar.appendChild(divContainer)
  }

  var address = document.getElementById("display-address")
  if (address) {
    address.textContent = properties.address
  } else {
    var new_address = document.createElement("p")
    new_address.textContent = properties.address
    new_address.className = "display-text"
    new_address.id = "display-address"
    divContainer.appendChild(new_address)
  }
  
  var link_to_pgp = document.getElementById("link-to-pgp")
  if (link_to_pgp) {
    link_to_pgp.href = properties.link_to_pgp
  } else {
    var new_link = document.createElement("a")
    new_link.textContent = "Property Information         "
    new_link.id = "link-to-pgp"
    new_link.className = "link-button"
    new_link.href = properties.link_to_pgp
    divContainer.appendChild(new_link)
  }
  var linkToGoogleMaps = document.getElementById("link-to-google-maps")
  if (linkToGoogleMaps) {
    linkToGoogleMaps.href = properties.link_to_google_maps
  } else {
    var new_link = document.createElement("a")
    new_link.textContent = "Google Maps Location"
    new_link.id = "link-to-google-maps"
    new_link.className += "link-button"
    new_link.href = properties.link_to_google_maps
    divContainer.appendChild(new_link)
  }
}

// Returns different colors depending on the string passed
// Used for the points layer
function getColor(type) {
  switch (type) {
  case "house":
    return "green";
  case "plot":
    return "blue";
  default:
    return "green";
  }
}
