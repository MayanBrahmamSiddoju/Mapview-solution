const modelFrame = document.getElementById('modelFrame');
const floorPlanFrame = document.getElementById('floorPlanFrame');

let modelSdk = null;
let floorPlanSdk = null;

// Connect to the SDK in the 3D model frame
modelFrame.addEventListener('load', async () => {
  try {
    modelSdk = await modelFrame.contentWindow.MP_SDK.connect(modelFrame.contentWindow);
    console.log('Connected to 3D Model SDK:', modelSdk);

    // Listen for camera pose changes in the 3D model view
    modelSdk.Camera.pose.subscribe(syncFloorPlan);
  } catch (error) {
    console.error('Error connecting to 3D Model SDK:', error);
  }
});

// Connect to the SDK in the floor plan frame
floorPlanFrame.addEventListener('load', async () => {
  try {
    floorPlanSdk = await floorPlanFrame.contentWindow.MP_SDK.connect(floorPlanFrame.contentWindow);
    console.log('Connected to Floor Plan SDK:', floorPlanSdk);

    // Ensure the floor plan view is set to FLOORPLAN mode immediately
    await ensureFloorPlanMode();

    console.log('Floor Plan view set to FLOORPLAN mode upon load.');
  } catch (error) {
    console.error('Error connecting to Floor Plan SDK:', error);
  }
});

// Ensure the floor plan is in FLOORPLAN mode before trying to sync
async function ensureFloorPlanMode() {
  try {
    // If already in FLOORPLAN mode, no need to move
    const currentMode = await floorPlanSdk.Mode.getCurrentMode();
    if (currentMode !== floorPlanSdk.Mode.Mode.FLOORPLAN) {
      await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
        transition: floorPlanSdk.Mode.TransitionType.INSTANT,
      });
    }
  } catch (error) {
    console.error('Error ensuring FLOORPLAN mode:', error);
  }
}

// Synchronize the floor plan view with the 3D model camera pose
async function syncFloorPlan(pose) {
  try {
    if (!floorPlanSdk) {
      console.warn('Floor Plan SDK is not ready.');
      return;
    }

    console.log('Synchronizing Floor Plan view with 3D Model pose:', pose);

    // Ensure floor plan is in correct mode
    await ensureFloorPlanMode();

    // Use Mode.moveTo to update the floor plan view to match the 3D model's current mode and position
    await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
      transition: floorPlanSdk.Mode.TransitionType.INSTANT,
    });

    console.log('Floor Plan view synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing Floor Plan view:', error);
  }
}

function closeContainer() {
  const container = document.querySelector('.container');
  container.style.visibility = 'hidden'; // Correct way to change the visibility
  container.style.opacity = '0'; // Optional: Use opacity for a smoother effect
  container.style.pointerEvents = 'none'; // Disable interaction
}

function openContainer() {
  const container = document.querySelector('.container');
  container.style.visibility = 'visible'; // Correct way to change the visibility
  container.style.opacity = '1'; // Optional: Use opacity for a smoother effect
  container.style.pointerEvents = 'auto'; // Re-enable interaction
  container.classList.add('active');

  // Trigger a resize or update for the renderer
  if (modelSdk) {
    modelSdk.Renderer.resize();
  }
}

