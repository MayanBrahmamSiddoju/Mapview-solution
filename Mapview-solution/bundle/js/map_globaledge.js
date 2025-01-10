// Mapbox initialization
mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';

const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');
const orthoCenter = [78.342262, 17.3922];
const orthoZoom = 17.5;

let map;
let geojsonData = null;
let floorMarkers = [];
let polygonVisibility = {};

// Initialize Mapbox map
function initializeMap() {
  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: orthoCenter,
    zoom: orthoZoom,
  });

  map.on('load', () => {
    // Add raster tileset layer
    map.addSource('orthoTileset', {
      type: 'raster',
      url: 'mapbox://rayapati49.cu3id2po',
    });
    map.addLayer({
      id: 'orthoTilesetLayer',
      source: 'orthoTileset',
      type: 'raster',
      layout: { visibility: 'visible' },
    });

    // Load and add GeoJSON layers
    loadGeoJSONLayers();
  });
}

// Load GeoJSON data and create polygon and line layers
function loadGeoJSONLayers() {
  axios.get('/bundle/assets/orthoPolygon.geojson').then((response) => {
    const data = response.data;
    let polygonColorIndex = 0;
    let lineColorIndex = 0;

    data.features.forEach((feature, index) => {
      const layerName = feature.properties.layer || `Layer ${index + 1}`;
      let color;

      if (feature.geometry.type === 'Polygon') {
        color = polygonColors[polygonColorIndex % polygonColors.length];
        addLayer(layerName, feature, color, 'fill');
        polygonColorIndex++;
      } else if (feature.geometry.type === 'LineString') {
        color = lineColors[lineColorIndex % lineColors.length];
        addLayer(layerName, feature, color, 'line');
        lineColorIndex++;
      }

      polygonVisibility[layerName] = true;
    });
  });
}

// Add GeoJSON layer to the map
function addLayer(layerName, feature, color, type) {
  map.addSource(layerName, {
    type: 'geojson',
    data: feature,
  });

  if (type === 'fill') {
    map.addLayer({
      id: `${layerName}Fill`,
      type: 'fill',
      source: layerName,
      paint: { 'fill-color': color, 'fill-opacity': 0.5 },
      layout: { visibility: 'visible' },
    });
    map.addLayer({
      id: `${layerName}Outline`,
      type: 'line',
      source: layerName,
      paint: { 'line-color': color, 'line-width': 2 },
      layout: { visibility: 'visible' },
    });
  } else if (type === 'line') {
    map.addLayer({
      id: `${layerName}Line`,
      type: 'line',
      source: layerName,
      paint: { 'line-color': color, 'line-width': 4 },
      layout: { visibility: 'visible' },
    });
  }
}

// Load GeoJSON data and create markers
async function loadGeoJSONMarkers() {
  try {
    const response = await axios.get('/bundle/assets/globaledge_spaces.geojson');
    geojsonData = response.data;
    return addPannel(geojsonData);
  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
  }
}

// Modified addPannel function
function addPannel(geojsonData) {
  const floorPanel = document.createElement('div');
  floorPanel.className = 'floor-panel';
  floorPanel.style.boxShadow = '0 0 10px #888888';
  floorPanel.style.marginTop = '20px';
  floorPanel.style.padding = '10px 5px 5px 4px';
  floorPanel.style.color = 'black';

  const ul = document.createElement('ul');
  ul.style.paddingLeft = '5px';
  ul.style.margin = '5px';

  geojsonData.floors.forEach((floor, index) => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'floor-checkbox';
    checkbox.id = `floor-${index}`;
    checkbox.onclick = () => handleFloorSelection(floor);

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = floor;

    const subUl = document.createElement('ul');
    subUl.style.paddingLeft = '20px';

    const subButtons = getSubButtonsForFloor(floor);
    subButtons.forEach(subButton => {
      const subLi = document.createElement('li');
      subLi.style.listStyle = 'none';

      const subCheckbox = document.createElement('input');
      subCheckbox.type = 'checkbox';
      subCheckbox.className = 'model-button-checkbox';
      subCheckbox.id = `sub-${subButton.name}`;

      const subLabel = document.createElement('label');
      subLabel.htmlFor = subCheckbox.id;
      subLabel.textContent = subButton.name;

      subLi.appendChild(subCheckbox);
      subLi.appendChild(subLabel);
      subUl.appendChild(subLi);
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(subUl);
    ul.appendChild(li);
  });

  floorPanel.appendChild(ul);
  return floorPanel;
}

// Function to get sub-buttons based on the floor
function getSubButtonsForFloor(floor) {
  const subButtons = {
    'Ground': [
      { name: 'Block 1', modelId: 'block1Id' },
      { name: 'Block 2', modelId: 'block2Id' },
      { name: 'Block UN', modelId: 'blockUNId' },
      { name: 'Block 4', modelId: 'block4Id' }
    ],
    'First': [
      { name: 'Dining Hall', modelId: 'Tqcgzn3Vfsv' },
      { name: 'Store', modelId: 'y7Z9Tt1weYt' },
    ],
    'Second': [
      { name: 'Biology Lab', modelId: 'vywA6PDMhE7' },
      { name: 'MP Hall', modelId: '7EdA6PDMhE7' }
    ]
  };
  return subButtons[floor] || [];
}

// Toggle layer visibility
function toggleLayerVisibility(layerName) {
  const isVisible = !polygonVisibility[layerName];
  polygonVisibility[layerName] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';

  map.setLayoutProperty(`${layerName}Fill`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Outline`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Line`, 'visibility', visibility);
}

// Handle floor selection and update markers
function handleFloorSelection(selectedFloor) {
  floorMarkers.forEach(marker => marker.remove());
  floorMarkers = [];

  const filteredFeatures = geojsonData.features.filter(
      feature => feature.properties.Floor === selectedFloor
  );

  filteredFeatures.forEach(feature => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.setAttribute('data-floor', feature.properties.Floor);

      const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
          offset: [0, 0],
          clickTolerance: 3
      })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);

      el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (feature.properties.m) {
              openModelViewer(feature.properties.m, feature.properties.Space);
          }
      });

      floorMarkers.push(marker);
  });
}

initializeMap();