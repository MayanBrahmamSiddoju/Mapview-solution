// Mapbox initialization
mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';

const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');
const walkthroughContainer = document.getElementById('walkthrough-container');

const orthoCenter = [81.6092, 21.2235];
const orthoZoom = 19;

const polygonColors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#8A2BE2'];
const lineColors = ['#FF4500', '#1E90FF', '#32CD32', '#FF1493', '#00FA9A'];

let map;
let geojsonData = null;
let floorMarkers = [];
let polygonVisibility = {};
let selectedLocation = null;

// Initialize Mapbox map
function initializeMap() {
  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: orthoCenter,
    zoom: orthoZoom,
  });

  // Create a container for layer controls
  const layerControlsContainer = document.createElement('div');
  layerControlsContainer.className = 'layer-controls-container';
  layerContainer.appendChild(layerControlsContainer);

  map.on('load', () => {
    // Add raster tileset layer
    map.addSource('orthoTileset', {
      type: 'raster',
      url: 'mapbox://rayapati49.5wcyodj0',
    });
    map.addLayer({
      id: 'orthoTilesetLayer',
      source: 'orthoTileset',
      type: 'raster',
      layout: { visibility: 'visible' },
    });

    // Load and add GeoJSON layers
    loadGeoJSONLayers();

    // Add polygon data for blocks
    const geojsonData = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'name': 'Block 3'
          },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [77.51965, 12.97155],
              [77.51965, 12.97170],
              [77.51990, 12.97170],
              [77.51990, 12.97155],
              [77.51965, 12.97155]
            ]]
          }
        },
        {
          'type': 'Feature',
          'properties': {
            'name': 'Block 4'
          },
          'geometry': {
            'type': 'Polygon',
            'coordinates': [[
              [77.51995, 12.97155],
              [77.51995, 12.97170],
              [77.52020, 12.97170],
              [77.52020, 12.97155],
              [77.51995, 12.97155]
            ]]
          }
        }
      ]
    };

    // Add the source
    map.addSource('blocks', {
      'type': 'geojson',
      'data': geojsonData
    });

    // Add the polygon layer
    map.addLayer({
      'id': 'blocks',
      'type': 'fill',
      'source': 'blocks',
      'paint': {
        'fill-color': [
          'match',
          ['get', 'name'],
          'Block 3', '#2ecc71',
          'Block 4', '#3498db',
          '#000000' // default color
        ],
        'fill-opacity': 0.6
      }
    });

    // Add the labels layer with enhanced visibility
    map.addLayer({
      'id': 'blocks-labels',
      'type': 'symbol',
      'source': 'blocks',
      'layout': {
        'text-field': ['get', 'name'],
        'text-size': 16,
        'text-anchor': 'center',
        'text-justify': 'center',
        'text-offset': [0, 0]
      },
      'paint': {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Add hover effect
    map.on('mousemove', 'blocks', (e) => {
      if (e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features[0];
        map.setPaintProperty('blocks', 'fill-opacity', [
          'case',
          ['==', ['get', 'name'], feature.properties.name],
          0.8,
          0.6,
        ]);
      }
    });

    map.on('mouseleave', 'blocks', () => {
      map.getCanvas().style.cursor = '';
      map.setPaintProperty('blocks', 'fill-opacity', 0.6);
    });

    // Add click event for opening model viewer
    map.on('click', 'blocks', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const blockName = feature.properties.name;
        // Open model viewer for the clicked block
        openModelViewerForFloor(blockName);
      }
    });
  });
}

// Load GeoJSON data and create polygon and line layers
function loadGeoJSONLayers() {
  axios.get('/bundle/assets/22110400104_22110400108_features.geojson').then((response) => {
    const data = response.data;
    let polygonColorIndex = 0;
    let lineColorIndex = 0;

    data.features.map((feature, index) => {
      const layerName = feature.properties.layer || `Layer ${index + 1}`;
      let color;

      if (feature.geometry.type === 'Polygon') {
        color = polygonColors[polygonColorIndex % polygonColors.length];
        addLayer(layerName, feature, color, 'fill');
        polygonColorIndex++;
        addLayerCheckbox(layerName, color);
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
    const response = await axios.get('/bundle/assets/22110400104_22110400108_spaces.geojson');
    geojsonData = response.data;

    // Call the function to create the floor panel and return it
    const floorPanel = addPannel(geojsonData);
    return floorPanel;
  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
  }
}

// Modified addPannel function
function addPannel(geojsonData) {
  console.log(geojsonData);
  const floorPanel = document.createElement('div');
  floorPanel.className = 'floor-panel';
  floorPanel.style.boxShadow = '0 0 10px #888888';
  floorPanel.style.marginTop = '20px';
  floorPanel.style.paddingLeft = '4px';
  floorPanel.style.paddingTop = '10px';
  floorPanel.style.paddingRight = '5px';
  floorPanel.style.paddingBottom = '5px';
  floorPanel.style.color = 'black';

  const ul = document.createElement('ul');
  ul.style.paddingLeft = '5px';
  ul.style.margin = '5px';

  geojsonData.floors.forEach((floor, index) => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';

    const button = document.createElement('button');
    button.className = 'floors';
    button.textContent = floor;
    button.style.marginTop = '7px';

    button.onclick = () => handleFloorSelection(floor);

    // Create a nested list for sub-buttons
    const subUl = document.createElement('ul');
    subUl.style.paddingLeft = '10px'; // Indent sub-buttons

    // Example sub-buttons for each floor
    const subButtons = getSubButtonsForFloor(floor); // Function to get sub-buttons based on the floor

    subButtons.forEach(subButton => {
      const subLi = document.createElement('li');
      subLi.style.listStyle = 'none';
      subLi.style.marginTop = '7px';

      const modelButton = document.createElement('button');
      modelButton.className = 'model-button';
      modelButton.textContent = subButton.name;

      // Check if the subButton has a URL or modelId
      if (subButton.url) {
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      } else {
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      }

      subLi.appendChild(modelButton); // Append the model button to the sub-list item
      subUl.appendChild(subLi);
    });

    li.appendChild(button);
    li.appendChild(subUl); // Append the sub-button list to the floor button
    ul.appendChild(li);
  });

  floorPanel.appendChild(ul);
  return floorPanel;
}

// Function to get sub-buttons based on the floor
function getSubButtonsForFloor(floor) {
  const subButtons = {
    'Block1 Ground': [
      { name: '4A Class Room', modelId: 'vywA6PDMhE7' },
      { name: '3A Class Room', modelId: '7EdA6zKCTwx' },
      { name: '2A Class Room', modelId: '7EdA6zKCTwx' },
      { name: 'Store Room', modelId: '7EdA6zKCTwx' },
    ],
    'BlockUN Ground': [
      { name: 'Kitchen & Toilets', modelId: 'vywA6PDMhE7' },
      { name: 'Anganwadi', modelId: '7EdA6zKCTwx' },
    ],
    'Block3 Ground': [
      { name: 'Staff Room', modelId: 'vywA6PDMhE7' },
      { name: 'Toilets', modelId: '7EdA6zKCTwx' },
    ],
    'Block4 Ground': [
      { name: 'Kitchen/Store Room', modelId: 'zQV33R4HsGA' },
      { name: 'HM/Staff Room', modelId: 'v1sp9avYgvY' },
      { name: 'Staff Room', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34' },
      { name: 'Class Room 1', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69' },
      { name: 'Gaurd Room', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65' },
      { name: 'Kitchen/Store Room', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97' },
      { name: 'Toilets 1', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=81&sr=-.23,-1.16' },
      { name: 'Toilets 2', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=11&sr=-.55,-1.09' },
    ],
    'Block4 First': [
      { name: 'Class Room 2', modelId: 'Tqcgzn3Vfsv' },
      { name: 'Computer Lab', modelId: 'y7Z9Tt1weYt' },
      { name: 'Class Room 3', modelId: 'y7Z9Tt1weYt' },
      { name: 'Class Room 4', modelId: 'y7Z9Tt1weYt' },
    ],
  };
  return subButtons[floor] || [];
}

// New function to handle 3D model viewing for specific areas
function openModelViewerForFloor(area) {
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const mapContainer = document.getElementById('map-container');
  const closeButton = document.querySelector('.close-button');

  if (!modelViewer || !modelFrame || !floorPlanFrame || !mapContainer) {
    console.error('Required elements not found in the DOM');
    return;
  }

  // Get the model URL based on the area
  const modelId = getModelIdForArea(area);
  const deepLink = getDeepLinkForArea(area);

  if (!modelId && !deepLink) {
    console.error('No model ID or deep link available for this area.');
    return;
  }

  // Set up the model URL
  const modelUrl = deepLink || `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1`;

  // Show the model viewer with sliding animation and shift map
  modelViewer.style.display = 'block';
  // Trigger reflow
  void modelViewer.offsetWidth;
  modelViewer.classList.add('active');
  mapContainer.classList.add('shifted');

  // After a short delay to allow the slide animation to start, load the iframes
  setTimeout(() => {
    modelFrame.src = modelUrl;
    floorPlanFrame.src = modelUrl;
  }, 100);

  // Function to close model viewer
  function closeModelViewer() {
    modelViewer.classList.remove('active');
    mapContainer.classList.remove('shifted');
    setTimeout(() => {
      modelViewer.style.display = 'none';
      modelFrame.src = '';
      floorPlanFrame.src = '';
    }, 400); // Wait for animation to complete
  }

  // Add click handler to close button
  if (closeButton) {
    closeButton.onclick = closeModelViewer;
  }

  // Add click handler to close when clicking outside
  document.addEventListener('click', function (event) {
    // Check if click is outside model viewer and model viewer is active
    if (modelViewer.classList.contains('active') &&
      !modelViewer.contains(event.target) &&
      event.target !== closeButton) {
      closeModelViewer();
    }
  });
}

// Function to get the deep link based on the area
function getDeepLinkForArea(area) {
  const deepLinks = {
    '4A Class Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34',
    '3A Class Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    '2A Class Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65',
    'Store Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97',
    'Kitchen & toilets': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34',
    'Anganwadi': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Staff Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Toilets': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Kitchen/Store Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65',
    'HM/Staff Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97',
    'Staff Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34',
    'Class Room 1': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Gaurd Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65',
    'Kitchen/Store Room': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97',
    'Toilets 1': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=81&sr=-.23,-1.16',
    'Toilets 2': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=11&sr=-.55,-1.09',
    'Class Room 2': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34',
    'Computer Lab': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Class Room 3': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65',
    'Class Room 4': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97',
  };
  return deepLinks[area] || '';
}

// Function to get the model ID based on the area
function getModelIdForArea(area) {
  const modelIds = {
    '4A Class Room': 'v1sp9avYgvY',
    '3A Class Room': 'v1sp9avYgvY',
    '2A Class Room': 'v1sp9avYgvY',
    'Store Room': 'v1sp9avYgvY',
    'Kitchen & Toilets': 'v1sp9avYgvY',
    'Anganwadi': 'v1sp9avYgvY',
    'Block3 Staff Room': 'v1sp9avYgvY',
    'Block3 Toilets': 'v1sp9avYgvY',
    'Block4 Kitchen/Store Room': 'v1sp9avYgvY',
    'HM/Staff Room': 'v1sp9avYgvY',
    'Block4 Staff Room': 'v1sp9avYgvY',
    'Class Room 1': 'v1sp9avYgvY',
    'Gaurd Room': 'v1sp9avYgvY',
    'Block4 Kitchen/Store Room 2': 'v1sp9avYgvY',
    'Block4 Toilets 1': 'v1sp9avYgvY',
    'Block4 Toilets 2': 'v1sp9avYgvY',
    'Class Room 2': 'v1sp9avYgvY',
    'Computer Lab': 'v1sp9avYgvY',
    'Class Room 3': 'v1sp9avYgvY',
    'Class Room 4': 'v1sp9avYgvY',
  };
  return modelIds[area] || '';
}

// Add checkbox for toggling layer visibility
async function addLayerCheckbox(layerName, color) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  // Create wrapper for checkbox and label
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const colorBox = document.createElement('div');
  colorBox.style.backgroundColor = color;
  colorBox.className = 'layer-color-box';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  checkbox.addEventListener('change', () => toggleLayerVisibility(layerName));

  const label = document.createElement('label');
  label.textContent = layerName;

  // Add expand/collapse arrow
  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow';
  arrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
  arrow.onclick = () => {
    buttonContainer.style.display = buttonContainer.style.display === 'none' ? 'block' : 'none';
    arrow.innerHTML = buttonContainer.style.display === 'none' ?
      '<i class="fas fa-chevron-right"></i>' :
      '<i class="fas fa-chevron-down"></i>';
  };

  // Add elements to checkbox wrapper
  checkboxWrapper.appendChild(arrow);
  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(colorBox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'tree-button-container';
  buttonContainer.style.display = 'none';

  // Add buttons based on the layer
  const buttons = getButtonsForLayer(layerName);
  buttons.forEach(buttonInfo => {
    const button = document.createElement('div');
    button.className = 'tree-button';

    const icon = document.createElement('i');
    icon.className = buttonInfo.icon;

    const text = document.createElement('span');
    text.textContent = buttonInfo.text;

    button.appendChild(icon);
    button.appendChild(text);
    button.onclick = buttonInfo.action;
    buttonContainer.appendChild(button);
  });

  container.appendChild(buttonContainer);
  document.querySelector('.layer-controls-container').appendChild(container);
}

// Helper function to get buttons for each layer
function getButtonsForLayer(layerName) {
  const buttons = [];

  switch (layerName) {
    case 'Block 1':
      buttons.push(
        { text: '4A Class Room', icon: 'fas fa-door-open', action: () => openModelViewerForFloor('4A Class Room') },
        { text: '3A Class Room', icon: 'fas fa-door-open', action: () => openModelViewerForFloor('3A Class Room') },
        { text: '2A Class Room', icon: 'fas fa-door-open', action: () => openModelViewerForFloor('2A Class Room') },
        { text: 'Store Room', icon: 'fas fa-box', action: () => openModelViewerForFloor('Store Room') },
      );
      break;
    case 'Block UN':
      buttons.push(
        { text: 'Kitchen & Toilets', icon: 'fas fa-utensils', action: () => openModelViewerForFloor('Kitchen & Toilets') },
        { text: 'Anganwadi', icon: 'fas fa-home', action: () => openModelViewerForFloor('Anganwadi') },
      );
      break;
    case 'Block 3':
      buttons.push(
        { text: 'Staff Room', icon: 'fas fa-users', action: () => openModelViewerForFloor('Block3 Staff Room') },
        { text: 'Toilets', icon: 'fas fa-restroom', action: () => openModelViewerForFloor('Block3 Toilets') },
      );
      break;
    case 'Block 4':
      // Ground Floor buttons
      buttons.push(
        { text: 'Kitchen/Store Room', icon: 'fas fa-warehouse', action: () => openModelViewerForFloor('Block4 Kitchen/Store Room') },
        { text: 'HM/Staff Room', icon: 'fas fa-user-tie', action: () => openModelViewerForFloor('HM/Staff Room') },
        { text: 'Staff Room', icon: 'fas fa-users', action: () => openModelViewerForFloor('Block4 Staff Room') },
        { text: 'Class Room 1', icon: 'fas fa-door-open', action: () => openModelViewerForFloor('Class Room 1') },
        { text: 'Gaurd Room', icon: 'fas fa-shield-alt', action: () => openModelViewerForFloor('Gaurd Room') },
        { text: 'Kitchen/Store Room', icon: 'fas fa-warehouse', action: () => openModelViewerForFloor('Block4 Kitchen/Store Room 2') },
        { text: 'Toilets 1', icon: 'fas fa-restroom', action: () => openModelViewerForFloor('Block4 Toilets 1') },
        { text: 'Toilets 2', icon: 'fas fa-restroom', action: () => openModelViewerForFloor('Block4 Toilets 2') },
      );
      break;
  }

  return buttons;
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
  console.log('Handling floor selection:', selectedFloor);

  // Map of floor names to their model IDs
  const modelMap = {
    '4A Class Room': 'v1sp9avYgvY',
    '3A Class Room': 'v1sp9avYgvY',
    '2A Class Room': 'v1sp9avYgvY',
    'Store Room': 'v1sp9avYgvY',
    'Kitchen & Toilets': 'v1sp9avYgvY',
    'Anganwadi': 'v1sp9avYgvY',
    'Block3 Staff Room': 'v1sp9avYgvY',
    'Block3 Toilets': 'v1sp9avYgvY',
    'Block4 Kitchen/Store Room': 'v1sp9avYgvY',
    'HM/Staff Room': 'v1sp9avYgvY',
    'Block4 Staff Room': 'v1sp9avYgvY',
    'Class Room 1': 'v1sp9avYgvY',
    'Gaurd Room': 'v1sp9avYgvY',
    'Block4 Kitchen/Store Room 2': 'v1sp9avYgvY',
    'Block4 Toilets 1': 'v1sp9avYgvY',
    'Block4 Toilets 2': 'v1sp9avYgvY',
    'Class Room 2': 'v1sp9avYgvY',
    'Computer Lab': 'v1sp9avYgvY',
    'Class Room 3': 'v1sp9avYgvY',
    'Class Room 4': 'v1sp9avYgvY',
  };

  const modelId = modelMap[selectedFloor];
  if (modelId) {
    openModelViewer(modelId, selectedFloor);
  } else {
    console.error('No model ID found for:', selectedFloor);
  }
}

function openModelViewer(modelId, spaceName) {
  console.log(`Opening model viewer for ${spaceName} with ID ${modelId}`);
  const modelViewer = document.getElementById('model-viewer');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const mapContainer = document.getElementById('map-container');
  const closeButton = document.querySelector('.close-button');

  if (!modelViewer || !modelFrame || !floorPlanFrame || !mapContainer) {
    console.error('Required elements not found in the DOM');
    return;
  }

  // Set up the model URL
  const modelUrl = `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1`;

  // Show the model viewer with sliding animation and shift map
  modelViewer.style.display = 'block';
  // Trigger reflow
  void modelViewer.offsetWidth;
  modelViewer.classList.add('active');
  mapContainer.classList.add('shifted');

  // After a short delay to allow the slide animation to start, load the iframes
  setTimeout(() => {
    modelFrame.src = modelUrl;
    floorPlanFrame.src = modelUrl;
  }, 100);

  // Function to close model viewer
  function closeModelViewer() {
    modelViewer.classList.remove('active');
    mapContainer.classList.remove('shifted');
    setTimeout(() => {
      modelViewer.style.display = 'none';
      modelFrame.src = '';
      floorPlanFrame.src = '';
    }, 400); // Wait for animation to complete
  }

  // Add click handler to close button
  if (closeButton) {
    closeButton.onclick = closeModelViewer;
  }

  // Add click handler to close when clicking outside
  document.addEventListener('click', function (event) {
    // Check if click is outside model viewer and model viewer is active
    if (modelViewer.classList.contains('active') &&
      !modelViewer.contains(event.target) &&
      event.target !== closeButton) {
      closeModelViewer();
    }
  });
}

function openModelViewerForFloor(area) {
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const mapContainer = document.getElementById('map-container');
  const closeButton = document.querySelector('.close-button');

  if (!modelViewer || !modelFrame || !floorPlanFrame || !mapContainer) {
    console.error('Required elements not found in the DOM');
    return;
  }

  // Get the model URL based on the area
  const modelId = getModelIdForArea(area);
  const deepLink = getDeepLinkForArea(area);

  if (!modelId && !deepLink) {
    console.error('No model ID or deep link available for this area.');
    return;
  }

  // Set up the model URL
  const modelUrl = deepLink || `https://my.matterport.com/show/?m=${modelId}&play=1&qs=1`;

  // Show the model viewer with sliding animation and shift map
  modelViewer.style.display = 'block';
  // Trigger reflow
  void modelViewer.offsetWidth;
  modelViewer.classList.add('active');
  mapContainer.classList.add('shifted');

  // After a short delay to allow the slide animation to start, load the iframes
  setTimeout(() => {
    modelFrame.src = modelUrl;
    floorPlanFrame.src = modelUrl;
  }, 100);

  // Function to close model viewer
  function closeModelViewer() {
    modelViewer.classList.remove('active');
    mapContainer.classList.remove('shifted');
    setTimeout(() => {
      modelViewer.style.display = 'none';
      modelFrame.src = '';
      floorPlanFrame.src = '';
    }, 400); // Wait for animation to complete
  }

  // Add click handler to close button
  if (closeButton) {
    closeButton.onclick = closeModelViewer;
  }

  // Add click handler to close when clicking outside
  document.addEventListener('click', function (event) {
    // Check if click is outside model viewer and model viewer is active
    if (modelViewer.classList.contains('active') &&
      !modelViewer.contains(event.target) &&
      event.target !== closeButton) {
      closeModelViewer();
    }
  });
}

const markerStyles = `
.marker {
  width: 20px;
  height: 20px;
  background-color: #4CAF50;
  border: 2px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  cursor: pointer !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  transform: rotate(-45deg);
  position: relative;
  animation: dropIn 0.5s ease-out;
}

.marker::after {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.marker:hover {
  transform: rotate(-45deg) scale(1.1);
  background-color: #45a049;
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.marker[data-floor="Block1 Ground"] {
  background-color: #4CAF50;  /* Green */
}

.marker[data-floor="BlockUN Ground"] {
  background-color: #2196F3;  /* Blue */
}

.marker[data-floor="Block3 Ground"] {
  background-color: #FF9800;  /* Orange */
}

.marker[data-floor="Block4 Ground"] {
  background-color:rgb(243, 33, 166);  /* Blue */
}

.marker[data-floor="Block4 First"] {
  background-color:rgb(251, 23, 31);  /* Orange */
}

@keyframes dropIn {
  from {
      transform: rotate(-45deg) translateY(-20px);
      opacity: 0;
  }
  to {
      transform: rotate(-45deg) translateY(0);
      opacity: 1;
  }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);

document.querySelector('.close-button').addEventListener('click', () => {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  modelViewer.classList.remove('active');
  modelOverlay.classList.remove('active');
  modelFrame.src = '';
  floorPlanFrame.src = '';
});

async function triggerFloorPlanView(modelUrl) {
  try {
    // Get the model frame element
    const modelFrame = document.getElementById('modelFrame');

    // Set the model frame source to the provided model URL
    modelFrame.src = modelUrl;

    // Wait for the model to load
    modelFrame.addEventListener('load', async () => {
      try {
        // Connect to the SDK
        const modelSdk = await modelFrame.contentWindow.MP_SDK.connect(modelFrame.contentWindow);
        console.log('Connected to 3D Model SDK:', modelSdk);

        // Ensure the model is in the correct mode (floor plan)
        await ensureFloorPlanMode(modelSdk);
        // await addFloorPlanMarker(); // Optionally add markers
      } catch (error) {
        console.error('Error connecting to 3D Model SDK:', error);
      }
    });
  } catch (error) {
    console.error('Error triggering floor plan view:', error);
  }
}

// Ensure Floor Plan Mode
async function ensureFloorPlanMode(modelSdk) {
  try {
    if (!modelSdk) {
      console.error("Model SDK is not initialized.");
      return;
    }

    console.log("Current Mode:", await modelSdk.Mode.getCurrentMode());
    console.log("Switching to FLOORPLAN mode...");

    // Introduce a delay before switching modes
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

    await modelSdk.Mode.moveTo(modelSdk.Mode.Mode.FLOORPLAN, {
      transition: modelSdk.Mode.TransitionType.FLY,
    });

    await modelSdk.Floor.showAll();
    await modelSdk.Camera.setRotation({
      x: -85,
      y: 0,
      z: 0,
    });
    console.log("Successfully switched to FLOORPLAN mode.");
  } catch (error) {
    console.error("Error ensuring FLOORPLAN mode:", error);
  }
}

// Add Floor Plan Marker
async function addFloorPlanMarker() {
  try {
    if (!floorPlanSdk) return;

    // Remove existing markers
    const existingMarkers = await floorPlanSdk.Mattertag.getData();
    for (const marker of existingMarkers) {
      await floorPlanSdk.Mattertag.remove(marker.sid);
    }

    // Add new position marker
    await floorPlanSdk.Mattertag.add({
      label: "Current Position",
      description: "",
      anchorPosition: { x: 0, y: 0, z: 0 },
      stemVector: { x: 0, y: 0, z: 0.1 },
      color: { r: 1, g: 0, b: 0 },
      floorIndex: 0,
    });
  } catch (error) {
    console.error("Error adding floor plan marker:", error);
  }
}

// Function to render the floor view for deep links
async function renderFloorView(deepLink, modelName) {
  const floorPlanFrame = document.getElementById('floorPlanFrame'); // Get the floor plan frame

  // Check if the model is a deep link and if the model name is "Rest of Ground Floor"
  if (deepLink && modelName === 'Rest of Ground Floor') {
    // Set the source of the floor plan frame to the appropriate URL
    floorPlanFrame.src = 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34'; // Replace with the actual URL of the floor plan
    floorPlanFrame.style.display = 'block'; // Ensure the frame is visible

    // Ensure the floor plan SDK is connected
    floorPlanFrame.addEventListener('load', async () => {
      try {
        floorPlanSdk = await floorPlanFrame.contentWindow.MP_SDK.connect(floorPlanFrame.contentWindow);
        console.log('Connected to Floor Plan SDK:', floorPlanSdk);

        // Ensure the floor plan mode is set correctly
        await ensureFloorPlanMode();
        // await addFloorPlanMarker(); // Optionally add markers
      } catch (error) {
        console.error('Error connecting to Floor Plan SDK:', error);
      }
    });
  } else {
    // Hide the floor plan frame for all other deep links
    if (deepLink) {
      floorPlanFrame.src = 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34'; // Clear the frame source
      floorPlanFrame.style.display = 'block'; // Hide the frame
    } else {
      // Show the floor plan frame for all other models
      floorPlanFrame.style.display = 'block'; // Ensure the frame is visible
    }
  }

  // Extract coordinates from the deep link
  const coordinates = extractCoordinatesFromDeepLink(deepLink);

  // Check if coordinates are available
  if (coordinates.ss && coordinates.sr) {
    // Logic to handle coordinates can be added here if needed
  } else {
    console.error('No valid coordinates found in the deep link.');
  }
}

// Function to ensure the floor plan mode is set correctly
async function ensureFloorPlanMode() {
  try {
    if (!floorPlanSdk) return; // Check if the floorPlanSdk is initialized

    // Move to the FLOORPLAN mode with a fly transition
    await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
      transition: floorPlanSdk.Mode.TransitionType.FLY,
    });

    // Show all floors in the floor plan
    await floorPlanSdk.Floor.showAll();

    // Set the camera rotation to a specific angle
    await floorPlanSdk.Camera.setRotation({
      x: -85, // Rotate the camera downwards
      y: 0, // No rotation around the Y-axis
      z: 0, // No rotation around the Z-axis
    });
  } catch (error) {
    console.error("Error ensuring FLOORPLAN mode:", error); // Log any errors
  }
}

// Function to add floor plan markers
async function addFloorPlanMarker() {
  try {
    if (!floorPlanSdk) return;

    // Remove existing markers
    const existingMarkers = await floorPlanSdk.Mattertag.getData();
    for (const marker of existingMarkers) {
      await floorPlanSdk.Mattertag.remove(marker.sid);
    }

    // Add new position marker
    await floorPlanSdk.Mattertag.add({
      label: "Current Position",
      description: "",
      anchorPosition: { x: 0, y: 0, z: 0 },
      stemVector: { x: 0, y: 0, z: 0.1 },
      color: { r: 1, g: 0, b: 0 },
      floorIndex: 0,
    });
  } catch (error) {
    console.error("Error adding floor plan marker:", error);
  }
}

// Example usage
const deepLink = 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34';
const modelName = 'Rest of Ground Floor'; // Example model name
renderFloorView(deepLink, modelName);

// Initialize the map
initializeMap();

// Initialize model viewer
const modelUrl = `/bundle/showcase.html?m=v1sp9avYgvY&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1`;
triggerFloorPlanView(modelUrl);

// Function to create the layer tree
function initializeLayers() {
  const layerToggles = document.getElementById('layer-toggles');
  if (!layerToggles) return;

  // Clear existing content
  layerToggles.innerHTML = '';

  // Create main school checkbox
  const schoolDiv = document.createElement('div');
  schoolDiv.className = 'tree-item';

  const schoolLabel = document.createElement('label');
  schoolLabel.className = 'tree-button';

  const schoolCheckbox = document.createElement('input');
  schoolCheckbox.type = 'checkbox';
  schoolCheckbox.checked = true;
  schoolCheckbox.id = 'school-checkbox';
  schoolCheckbox.className = 'layer-checkbox';

  const schoolSpan = document.createElement('span');
  schoolSpan.textContent = 'School';

  schoolLabel.appendChild(schoolCheckbox);
  schoolLabel.appendChild(schoolSpan);
  schoolDiv.appendChild(schoolLabel);

  // Create blocks container
  const blocksContainer = document.createElement('div');
  blocksContainer.className = 'tree-children';

  // Define blocks
  const blocks = {
    'Block 3': [
      '4A Class Room',
      '3A Class Room',
      '2A Class Room',
      'Store Room',
      'Kitchen & Toilets',
      'Anganwadi',
      'Block3 Staff Room',
      'Block3 Toilets',
    ],
    'Block 4': [
      'Block4 Kitchen/Store Room',
      'HM/Staff Room',
      'Block4 Staff Room',
      'Class Room 1',
      'Gaurd Room',
      'Block4 Kitchen/Store Room 2',
      'Block4 Toilets 1',
      'Block4 Toilets 2',
      'Class Room 2',
      'Computer Lab',
      'Class Room 3',
      'Class Room 4',
    ],
  };

  // Create block checkboxes
  Object.entries(blocks).forEach(([blockName, rooms]) => {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'tree-item';

    const blockLabel = document.createElement('label');
    blockLabel.className = 'tree-button';

    const blockCheckbox = document.createElement('input');
    blockCheckbox.type = 'checkbox';
    blockCheckbox.checked = true;
    blockCheckbox.className = 'layer-checkbox block-checkbox';
    blockCheckbox.dataset.block = blockName;

    const blockSpan = document.createElement('span');
    blockSpan.textContent = blockName;

    blockLabel.appendChild(blockCheckbox);
    blockLabel.appendChild(blockSpan);
    blockDiv.appendChild(blockLabel);

    // Create rooms container
    const roomsContainer = document.createElement('div');
    roomsContainer.className = 'tree-children';

    // Add rooms
    rooms.forEach(roomName => {
      const roomDiv = document.createElement('div');
      roomDiv.className = 'tree-item';

      const roomLabel = document.createElement('label');
      roomLabel.className = 'tree-button';

      const roomCheckbox = document.createElement('input');
      roomCheckbox.type = 'checkbox';
      roomCheckbox.checked = true;
      roomCheckbox.className = 'layer-checkbox room-checkbox';
      roomCheckbox.dataset.room = roomName;

      const roomSpan = document.createElement('span');
      roomSpan.textContent = roomName;

      roomLabel.appendChild(roomCheckbox);
      roomLabel.appendChild(roomSpan);
      roomDiv.appendChild(roomLabel);
      roomsContainer.appendChild(roomDiv);
    });

    blockDiv.appendChild(roomsContainer);
    blocksContainer.appendChild(blockDiv);
  });

  // Add event listeners
  schoolCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    blocksContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = isChecked;
    });
  });

  blocksContainer.querySelectorAll('.block-checkbox').forEach(blockCheckbox => {
    blockCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const blockDiv = e.target.closest('.tree-item');
      blockDiv.querySelectorAll('.room-checkbox').forEach(roomCheckbox => {
        roomCheckbox.checked = isChecked;
      });
    });
  });

  // Append everything
  schoolDiv.appendChild(blocksContainer);
  layerToggles.appendChild(schoolDiv);
}

// Initialize layers when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLayers);