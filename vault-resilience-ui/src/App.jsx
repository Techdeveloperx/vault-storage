import { useEffect, useState } from "react";
import "./App.css";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Cloud,
  Database,
  Download,
  HardDrive,
  HeartPulse,
  RefreshCw,
  Shield,
  ShieldCheck,
  Upload,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

import { getSystemStatus, uploadFile, downloadFile } from "./api";

const initialNodes = [
  {
    id: "N1",
    name: "VAULT-NODE-01",
    location: "Primary Storage",
    status: "healthy",
    latency: "24 ms",
    replicas: 12,
  },
  {
    id: "N2",
    name: "VAULT-NODE-02",
    location: "Replica Storage",
    status: "healthy",
    latency: "31 ms",
    replicas: 11,
  },
  {
    id: "N3",
    name: "VAULT-NODE-03",
    location: "Replica Storage",
    status: "healthy",
    latency: "28 ms",
    replicas: 12,
  },
];

const initialFiles = [
  {
    name: "research-dataset.zip",
    size: "248 MB",
    replicas: 3,
    integrity: "verified",
  },
  {
    name: "project-report.pdf",
    size: "12.8 MB",
    replicas: 3,
    integrity: "verified",
  },
  {
    name: "test.txt",
    size: "4 KB",
    replicas: 3,
    integrity: "verified",
  },
];

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [files, setFiles] = useState(initialFiles);

  const [events, setEvents] = useState([
    "All storage replicas verified",
    "SHA-256 integrity check completed",
    "3/3 storage nodes online",
  ]);

  const [simulation, setSimulation] = useState("idle");

  // REAL GATEWAY DATA
  const [liveStatus, setLiveStatus] = useState(null);
  const [gatewayError, setGatewayError] = useState(false);

  // UPLOAD STATE
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  /*
   * Fetch real status from:
   * https://vault-gateway.onrender.com/status
   *
   * Refreshes every 10 seconds.
   */
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getSystemStatus();

        setLiveStatus(data);

        if (data.nodes) {
          const nodeStatuses = Object.values(data.nodes);

          setNodes((currentNodes) =>
            currentNodes.map((node, index) => ({
              ...node,
              status:
                nodeStatuses[index] === "UP"
                  ? "healthy"
                  : "offline",
            }))
          );
        }

        setGatewayError(false);
      } catch (error) {
        console.error("Gateway connection failed:", error);
        setGatewayError(true);
      }
    };

    loadStatus();

    const interval = setInterval(loadStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const healthyNodes = nodes.filter(
    (node) => node.status === "healthy"
  ).length;

  const safetyScore =
    healthyNodes === 3
      ? 100
      : healthyNodes === 2
      ? 67
      : 33;

  // -----------------------------
  // REAL FILE UPLOAD
  // -----------------------------

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setUploadMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("");

      const result = await uploadFile(selectedFile);

      if (result.status === "success") {
        const newFile = {
          name: selectedFile.name,
          size: formatFileSize(selectedFile.size),
          replicas: result.confirmed_nodes?.length || 0,
          integrity: "verified",
        };

        setFiles((current) => {
          const exists = current.some(
            (file) => file.name === newFile.name
          );

          if (exists) {
            return current.map((file) =>
              file.name === newFile.name ? newFile : file
            );
          }

          return [newFile, ...current];
        });

        setEvents((current) => [
          `✓ ${selectedFile.name} uploaded successfully`,
          `✓ ${result.confirmed_nodes?.length || 0}/3 replicas confirmed`,
          "✓ SHA-256 checksum verified",
          ...current,
        ]);

        setUploadMessage(
          `Upload successful — ${
            result.confirmed_nodes?.length || 0
          }/3 replicas confirmed`
        );

        setSelectedFile(null);

        const input = document.getElementById("file-upload-input");

        if (input) {
          input.value = "";
        }

        // Refresh real backend status
        try {
          const freshStatus = await getSystemStatus();
          setLiveStatus(freshStatus);
        } catch (error) {
          console.error("Status refresh failed:", error);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);

      setUploadMessage(
        error.message || "Upload failed. Please try again."
      );

      setEvents((current) => [
        `✕ Upload failed: ${selectedFile.name}`,
        ...current,
      ]);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB"];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${
      units[index]
    }`;
  };

  // -----------------------------
  // FAILURE SIMULATION
  // -----------------------------

  const simulateFailure = () => {
    setNodes((current) =>
      current.map((node, index) =>
        index === 1
          ? {
              ...node,
              status: "offline",
            }
          : node
      )
    );

    setSimulation("failure");

    setEvents((current) => [
      "⚠ Node 02 failure detected",
      "Read quorum maintained through remaining replicas",
      ...current,
    ]);
  };

  const recoverSystem = () => {
    setNodes(initialNodes);
    setSimulation("recovery");

    setEvents((current) => [
      "✓ Node 02 successfully recovered",
      "✓ Replica synchronization completed",
      "✓ Cluster restored to 3/3 nodes",
      ...current,
    ]);
  };

  const corruptReplica = () => {
    setSimulation("corruption");

    setFiles((current) =>
      current.map((file, index) =>
        index === 0
          ? {
              ...file,
              integrity: "repairing",
              replicas: 2,
            }
          : file
      )
    );

    setEvents((current) => [
      "⚠ Bit-rot simulation detected",
      "Checksum mismatch found on replica",
      "⟳ Self-healing process initiated",
      ...current,
    ]);
  };

  const repairReplica = () => {
    setSimulation("repaired");

    setFiles((current) =>
      current.map((file) => ({
        ...file,
        integrity: "verified",
        replicas: 3,
      }))
    );

    setEvents((current) => [
      "✓ Replica repaired successfully",
      "✓ SHA-256 checksum verified",
      "✓ All replicas synchronized",
      ...current,
    ]);
  };

  return (
    <div className="app-shell">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h1>VAULT</h1>
            <span>RESILIENCE OS</span>
          </div>

        </div>

        <nav>

          <div className="nav-item active">
            <Activity size={18} />
            Command Center
          </div>

          <div className="nav-item">
            <Database size={18} />
            Storage
          </div>

          <div className="nav-item">
            <HardDrive size={18} />
            Nodes
          </div>

          <div className="nav-item">
            <Shield size={18} />
            Integrity
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="connection">

            <span className="pulse"></span>

            {gatewayError
              ? "Gateway Offline"
              : "Gateway Connected"}

          </div>

          <small>
            Distributed Object Storage
          </small>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main">

        {/* HEADER */}

        <header className="topbar">

          <div>

            <p className="eyebrow">
              DISTRIBUTED STORAGE / LIVE CONTROL
            </p>

            <h2>
              Resilience Command Center
            </h2>

          </div>

          <div className="system-status">

            <span className="pulse"></span>

            <div>

              <strong>

                {healthyNodes === 3
                  ? "SYSTEM HEALTHY"
                  : healthyNodes === 2
                  ? "SYSTEM DEGRADED"
                  : "SYSTEM CRITICAL"}

              </strong>

              <small>
                {healthyNodes}/3 nodes operational
              </small>

            </div>

          </div>

        </header>

        {/* ================= METRICS ================= */}

        <section className="metrics-grid">

          <div className="metric-card highlight">

            <div className="metric-icon">
              <ShieldCheck size={22} />
            </div>

            <div>

              <span>DATA SAFETY</span>

              <strong>
                {safetyScore}%
              </strong>

              <small>
                {safetyScore === 100
                  ? "Fully protected"
                  : "Reduced redundancy"}
              </small>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              <Database size={22} />
            </div>

            <div>

              <span>OBJECTS STORED</span>

              <strong>
                {liveStatus?.total_files ?? files.length}
              </strong>

              <small>
                Distributed objects
              </small>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              <HardDrive size={22} />
            </div>

            <div>

              <span>REPLICAS</span>

              <strong>
                {files.reduce(
                  (sum, file) =>
                    sum + file.replicas,
                  0
                )}
              </strong>

              <small>
                Redundant copies
              </small>

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-icon">
              <HeartPulse size={22} />
            </div>

            <div>

              <span>QUORUM</span>

              <strong>
                2 / 3
              </strong>

              <small>
                Read / Write policy
              </small>

            </div>

          </div>

        </section>

        {/* ================= TOPOLOGY ================= */}

        <section className="section-grid">

          <div className="panel topology-panel">

            <div className="panel-header">

              <div>

                <span className="section-label">
                  LIVE TOPOLOGY
                </span>

                <h3>
                  Storage Cluster
                </h3>

              </div>

              <Wifi size={20} />

            </div>

            <div className="topology">

              <div className="gateway-node">

                <Cloud size={30} />

                <strong>
                  GATEWAY
                </strong>

                <span>
                  API ROUTER
                </span>

              </div>

              <div className="connection-lines">

                <div></div>
                <div></div>
                <div></div>

              </div>

              <div className="node-row">

                {nodes.map((node) => (

                  <div
                    className={`storage-node ${node.status}`}
                    key={node.id}
                  >

                    <div className="node-status-dot"></div>

                    <div className="node-icon">
                      <HardDrive size={25} />
                    </div>

                    <strong>
                      {node.name}
                    </strong>

                    <span>
                      {node.location}
                    </span>

                    <div className="node-stats">

                      <span>
                        {node.latency}
                      </span>

                      <span>
                        {node.replicas} replicas
                      </span>

                    </div>

                    <div className="node-state">

                      {node.status === "healthy" ? (

                        <>
                          <CheckCircle2 size={14} />
                          HEALTHY
                        </>

                      ) : (

                        <>
                          <XCircle size={14} />
                          OFFLINE
                        </>

                      )}

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* ================= SAFETY ================= */}

          <div className="panel safety-panel">

            <div className="panel-header">

              <div>

                <span className="section-label">
                  RESILIENCE SCORE
                </span>

                <h3>
                  Data Protection
                </h3>

              </div>

              <Shield size={20} />

            </div>

            <div className="score-circle">

              <div>

                <strong>
                  {safetyScore}
                </strong>

                <span>
                  /100
                </span>

              </div>

            </div>

            <div className="safety-text">

              <strong>

                {safetyScore === 100
                  ? "Your data is protected"
                  : "Redundancy is reduced"}

              </strong>

              <span>
                Replication, quorum and integrity
                checks are being monitored
                continuously.
              </span>

            </div>

            <div className="protection-row">

              <div>
                <CheckCircle2 size={16} />
                Replication
              </div>

              <div>
                <CheckCircle2 size={16} />
                Quorum
              </div>

              <div>
                <CheckCircle2 size={16} />
                Integrity
              </div>

            </div>

          </div>

        </section>

        {/* ================= RESILIENCE LAB ================= */}

        <section className="panel resilience-panel">

          <div className="panel-header">

            <div>

              <span className="section-label">
                CHAOS / RECOVERY ENGINE
              </span>

              <h3>
                Resilience Lab
              </h3>

            </div>

            <Zap size={20} />

          </div>

          <p className="description">

            Test how Vault behaves when
            infrastructure fails. These controls
            are designed for live failure
            demonstrations.

          </p>

          <div className="action-grid">

            <button
              className="danger-action"
              onClick={simulateFailure}
            >
              <AlertTriangle size={19} />
              Fail Node 02
            </button>

            <button
              className="warning-action"
              onClick={corruptReplica}
            >
              <AlertTriangle size={19} />
              Corrupt Replica
            </button>

            <button
              className="repair-action"
              onClick={repairReplica}
            >
              <RefreshCw size={19} />
              Repair Replica
            </button>

            <button
              className="success-action"
              onClick={recoverSystem}
            >
              <CheckCircle2 size={19} />
              Recover Cluster
            </button>

          </div>

          {simulation !== "idle" && (

            <div className="simulation-banner">

              <CircleDot size={17} />

              <span>

                {simulation === "failure" &&
                  "Node failure simulated — quorum remains available."}

                {simulation === "corruption" &&
                  "Checksum mismatch detected — replica requires repair."}

                {simulation === "repaired" &&
                  "Replica successfully repaired and verified."}

                {simulation === "recovery" &&
                  "Cluster recovered — all nodes operational."}

              </span>

            </div>

          )}

        </section>

        {/* ================= FILES + TIMELINE ================= */}

        <section className="bottom-grid">

          <div className="panel">

            <div className="panel-header">

              <div>

                <span className="section-label">
                  OBJECT STORE
                </span>

                <h3>
                  Protected Files
                </h3>

              </div>

              <Upload size={20} />

            </div>

            {/* REAL UPLOAD AREA */}

            <div className="upload-area">

              <input
                id="file-upload-input"
                type="file"
                onChange={handleFileSelect}
              />

              <button
                className="upload-button"
                onClick={handleUpload}
                disabled={uploading}
              >
                <Upload size={16} />

                {uploading
                  ? "Uploading..."
                  : "Upload File"}
              </button>

              {selectedFile && (
                <span className="selected-file">
                  Selected: {selectedFile.name}
                </span>
              )}

              {uploadMessage && (
                <span className="upload-message">
                  {uploadMessage}
                </span>
              )}

            </div>

            <div className="file-list">

              {files.length === 0 ? (

                <div className="empty-state">
                  No files stored yet.
                </div>

              ) : (

                files.map((file) => (

                  <div
                    className="file-row"
                    key={file.name}
                  >

                    <div className="file-icon">
                      <Database size={18} />
                    </div>

                    <div className="file-info">

                      <strong>
                        {file.name}
                      </strong>

                      <span>
                        {file.size}
                      </span>

                    </div>

                    <div className="replica-pill">

                      {file.replicas}/3 replicas

                    </div>

                    <div
                      className={`integrity ${file.integrity}`}
                    >

                      {file.integrity === "verified" ? (

                        <CheckCircle2 size={14} />

                      ) : (

                        <RefreshCw size={14} />

                      )}

                      {file.integrity === "verified"
                        ? "VERIFIED"
                        : "REPAIRING"}

                    </div>

                    {/* REAL DOWNLOAD BUTTON */}

                    <button
                      className="download-btn"
                      onClick={() =>
                        downloadFile(file.name)
                      }
                      title={`Download ${file.name}`}
                    >
                      <Download size={16} />
                    </button>

                  </div>

                ))

              )}

            </div>

          </div>

          {/* ================= TIMELINE ================= */}

          <div className="panel">

            <div className="panel-header">

              <div>

                <span className="section-label">
                  SYSTEM TELEMETRY
                </span>

                <h3>
                  Recovery Timeline
                </h3>

              </div>

              <Activity size={20} />

            </div>

            <div className="timeline">

              {events
                .slice(0, 6)
                .map((event, index) => (

                  <div
                    className="timeline-item"
                    key={`${event}-${index}`}
                  >

                    <div className="timeline-dot"></div>

                    <div>

                      <strong>
                        {event}
                      </strong>

                      <span>

                        {index === 0
                          ? "Just now"
                          : `${index}m ago`}

                      </span>

                    </div>

                  </div>

                ))}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;