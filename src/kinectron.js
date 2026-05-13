// My current test code that draws a dot for each person tracking the position of the hips.

var kinectron;
// Maximum and minimum depth or distance values reported by the Kinect, expressed in meters.
var cameraMaxZ = 4.5;
var cameraMinZ = 1.5;

function setup() {
  createCanvas(600, 600);
  console.log("starting");
  background(0);

  // IP address of Windows computer that is connected to the Kinect device.
  // If this same computer is being used, then use local host IP address of "127.0.0.1"
  kinectron = new Kinectron("192.168.1.143");
 
  kinectron.makeConnection();
 
  // Kinectron will automatically call drawBody each time it receives new data.
  kinectron.startTrackedBodies(drawBody);
}

function draw() {
 
}

function drawBody(body){
  // clear screen to white background color
  background(255);

  // Each body part joint has a unique integer index.
  // Index 0 refers to the hip joint.
  // Reference for kinectron joint indices.
  // https://lisajamhoury.medium.com/understanding-kinect-v2-joints-and-coordinate-system-4f4b90b9df16

  // Kinect report .depthX and .depthY values in range 0.0 to 1.0
  let normalizedX = body.joints[0].depthX;

  // Normalize .depthZ value from meters to be between 0.0 and 1.0
let normalizedZ = (body.joints[0].cameraZ - 1.5) / (cameraMaxZ - cameraMinZ);

  // Map left-right position and distance from Kinect to (x,y) point on the 2D screen.
  // Call function to do something with the normalized coordinates.
  drawDot(normalizedX, normalizedZ);
}

function drawDot(normalizedX, normalizedY) {
  // set current fill color to RGB value of red + blue = purple
  fill(255,0,255);

  // Multiply normalized values in [0.0, 1.0] by window width and height.
  // Third argument is the radius of the dot in pixels.
  ellipse(normalizedX * width, normalizedZ * height, 20);
}