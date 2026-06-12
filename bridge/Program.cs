using System.Numerics;
using System.Text.Json;
using Fleck;
using Microsoft.Azure.Kinect.BodyTracking;
using Microsoft.Azure.Kinect.Sensor;

// ── Calibration ───────────────────────────────────────────────────────────────
// Physical setup: Kinect at center-left, facing along display +X axis.
//
//   Joint.Position.Z  (depth from sensor, mm)   →  display X  (0 = near, 100 = far)
//   Joint.Position.X  (lateral offset, mm)       →  display Y  (0 = left, 100 = right)
//
// To tune: run the bridge, open EchoField with Kinect enabled, walk each edge
// of the projection area, and adjust the four constants until the dot tracks correctly.

const float ZMin = 1300f;   // mm — nearest person tracked
const float ZMax = 4000f;   // mm — farthest person tracked
const float XMin = -1200f;  // mm — left edge of projection  ← likely needs tuning
const float XMax =  1200f;  // mm — right edge of projection ← likely needs tuning
const int   MaxBodies = 2;  // match VITE_MULTI_PERSON in .env.local

static float Norm(float v, float lo, float hi) =>
    MathF.Round(Math.Clamp((v - lo) / (hi - lo) * 100f, 0f, 100f), 2);

// ── WebSocket server ──────────────────────────────────────────────────────────
var clients    = new List<IWebSocketConnection>();
var clientLock = new object();

FleckLog.Level = LogLevel.Warn;   // suppress Fleck's verbose startup messages

var wsServer = new WebSocketServer("ws://0.0.0.0:8765");
wsServer.Start(socket =>
{
    socket.OnOpen = () =>
    {
        lock (clientLock) clients.Add(socket);
        Console.WriteLine($"[ws] browser connected  ({clients.Count} client(s))");
    };
    socket.OnClose = () =>
    {
        lock (clientLock) clients.Remove(socket);
        Console.WriteLine($"[ws] browser disconnected ({clients.Count} client(s))");
    };
    socket.OnError = _ => { /* closed sockets cleaned up in broadcast */ };
});

Console.WriteLine("Azure Kinect bridge  →  ws://localhost:8765");
Console.WriteLine("Ctrl-C to stop\n");

// ── Azure Kinect device ───────────────────────────────────────────────────────
using var device = Device.Open();

device.StartCameras(new DeviceConfiguration
{
    ColorResolution = ColorResolution.Off,   // colour not needed; reduces load
    DepthMode       = DepthMode.NFOV_Unbinned,
    CameraFPS       = FPS.FPS30,
});

// Calibration must match the depth mode and colour resolution used above.
var calibration = device.GetCalibration(DepthMode.NFOV_Unbinned, ColorResolution.Off);

// ── Body tracker ──────────────────────────────────────────────────────────────
// Switch ProcessingMode to TrackerProcessingMode.Cpu if the GPU path fails
// (e.g. no discrete GPU / missing ONNX Runtime GPU provider).
using var tracker = Tracker.Create(calibration, new TrackerConfiguration
{
    SensorOrientation = SensorOrientation.Default,
    ProcessingMode    = TrackerProcessingMode.Gpu,
});

Console.WriteLine("[kinect] body tracker started — waiting for bodies…\n");

// ── Main capture loop ─────────────────────────────────────────────────────────
while (true)
{
    // GetCapture blocks until the next frame arrives (~30fps).
    using var capture = device.GetCapture();
    tracker.EnqueueCapture(capture);

    // PopResult blocks until the tracker has processed the frame.
    using var frame = tracker.PopResult();

    var positions = new List<object>();

    uint numBodies = Math.Min(frame.NumberOfBodies, (uint)MaxBodies);
    for (uint i = 0; i < numBodies; i++)
    {
        Skeleton sk  = frame.GetBodySkeleton(i);
        Joint    j   = sk.GetJoint(JointId.Pelvis);
        Vector3  pos = j.Position;   // camera-space XYZ in millimetres

        positions.Add(new
        {
            x = Norm(pos.Z, ZMin, ZMax),   // depth    → display X
            y = Norm(pos.X, XMin, XMax),   // lateral  → display Y
        });
    }

    // Broadcast JSON to every connected browser.
    // Format: { "type": "positions", "positions": [{ "x": 42.5, "y": 67.1 }, …] }
    var msg = JsonSerializer.Serialize(new { type = "positions", positions });

    lock (clientLock)
    {
        foreach (var c in clients.ToList())
        {
            try   { c.Send(msg); }
            catch { clients.Remove(c); }   // prune dead connections
        }
    }
}
