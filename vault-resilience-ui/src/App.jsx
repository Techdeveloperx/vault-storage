import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import "./App.css";

import {
  getSystemStatus,
  getFiles,
} from "./api";

import Sidebar from "./components/Sidebar";
import MetricsGrid from "./components/MetricsGrid";
import ClusterTopology from "./components/ClusterTopology";
import ResilienceScore from "./components/ResilienceScore";
import FileManager from "./components/FileManager";

function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [gatewayError, setGatewayError] = useState(false);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------
  // LOAD SYSTEM STATUS
  // ----------------------------------------

  const loadSystemStatus = useCallback(async () => {
    try {
      const data = await getSystemStatus();

      setSystemStatus(data);
      setGatewayError(false);
    } catch (error) {
      console.error("Gateway status error:", error);
      setGatewayError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ----------------------------------------
  // LOAD FILES
  // ----------------------------------------

  const loadFiles = useCallback(async () => {
    try {
      const data = await getFiles();

      if (Array.isArray(data)) {
        setFiles(data);
        return;
      }

      if (data && typeof data === "object") {
        const normalizedFiles = Object.entries(data).map(
          ([fileId, info]) => ({
            ...(info || {}),
            file_id:
              info?.file_id ||
              info?.filename ||
              fileId,
            name:
              info?.name ||
              info?.filename ||
              fileId,
          })
        );

        setFiles(normalizedFiles);
        return;
      }

      setFiles([]);
    } catch (error) {
      console.error("File loading error:", error);
      setFiles([]);
    }
  }, []);

  // ----------------------------------------
  // REFRESH DASHBOARD
  // ----------------------------------------

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      loadSystemStatus(),
      loadFiles(),
    ]);
  }, [loadSystemStatus, loadFiles]);

  // ----------------------------------------
  // INITIAL LOAD + LIVE POLLING
  // ----------------------------------------

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      refreshDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshDashboard]);

  // ----------------------------------------
  // NORMALIZE BACKEND NODES
  // ----------------------------------------

  const nodes = useMemo(() => {
    const backendNodes = systemStatus?.nodes || {};

    return Object.entries(backendNodes).map(
      ([url, status], index) => {
        const isUp =
          String(status).toUpperCase() === "UP";

        return {
          id: `node-${index + 1}`,

          name: `NODE ${String(index + 1).padStart(
            2,
            "0"
          )}`,

          location: url
            .replace(/^https?:\/\//, "")
            .replace(/\.onrender\.com.*$/, ""),

          status: isUp
            ? "healthy"
            : "offline",

          latency: isUp
            ? "ONLINE"
            : "OFFLINE",

          replicas: 0,
        };
      }
    );
  }, [systemStatus]);

  // ----------------------------------------
  // FILE COUNT
  // ----------------------------------------

  const totalFiles =
    systemStatus?.total_files ??
    files.length ??
    0;

  // ----------------------------------------
  // REPLICA COUNT
  // ----------------------------------------

  const totalReplicas = useMemo(() => {
    return files.reduce((total, file) => {
      const replicas =
        file.replication_factor ??
        file.replicas ??
        file.confirmed_nodes?.length ??
        0;

      return total + Number(replicas || 0);
    }, 0);
  }, [files]);

  // ----------------------------------------
  // RESILIENCE SCORE
  // ----------------------------------------

  const safetyScore = useMemo(() => {
    if (!nodes.length) {
      return 0;
    }

    const healthyNodes = nodes.filter(
      (node) => node.status === "healthy"
    ).length;

    const nodeHealthScore =
      (healthyNodes / nodes.length) * 70;

    const replicationScore =
      files.length > 0
        ? Math.min(
            (totalReplicas /
              (files.length * 3)) *
              30,
            30
          )
        : 30;

    return Math.round(
      Math.min(
        nodeHealthScore + replicationScore,
        100
      )
    );
  }, [
    nodes,
    files,
    totalReplicas,
  ]);

  // ----------------------------------------
  // LOADING SCREEN
  // ----------------------------------------

  if (loading && !systemStatus) {
    return (
      <div className="app-loading">
        <motion.div
          className="loading-core"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />

        <motion.h1
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          VAULT
        </motion.h1>

        <span>
          INITIALIZING RESILIENCE OS...
        </span>
      </div>
    );
  }

  // ----------------------------------------
  // MAIN UI
  // ----------------------------------------

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <Sidebar
        gatewayError={gatewayError}
      />

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP HEADER */}

        <motion.header
          className="topbar"
          initial={{
            opacity: 0,
            y: -15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div>
            <span className="eyebrow">
              INFRASTRUCTURE CONTROL
            </span>

            <h1>
              Resilience Command Center
            </h1>

            <p>
              Distributed object storage telemetry
              and recovery control.
            </p>
          </div>

          <motion.div
            className={`system-status ${
              gatewayError
                ? "offline"
                : "online"
            }`}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <span />

            {gatewayError
              ? "GATEWAY OFFLINE"
              : "SYSTEM OPERATIONAL"}
          </motion.div>
        </motion.header>

        {/* METRICS */}

        <MetricsGrid
          safetyScore={safetyScore}
          totalFiles={totalFiles}
          totalReplicas={totalReplicas}
        />

        {/* DASHBOARD */}

        <div className="dashboard-grid">

          {/* MAIN COLUMN */}

          <div className="dashboard-main">

            <ClusterTopology
              nodes={nodes}
            />

            <FileManager
              files={files}
              onRefresh={refreshDashboard}
            />

          </div>

          {/* SIDE COLUMN */}

          <aside className="dashboard-side">

            <ResilienceScore
              score={safetyScore}
            />

            {/* STORAGE POLICY */}

            <motion.div
              className="system-info-card"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: 0.4,
              }}
            >
              <span className="eyebrow">
                STORAGE POLICY
              </span>

              <div className="info-row">
                <span>
                  Replication
                </span>

                <strong>
                  3×
                </strong>
              </div>

              <div className="info-row">
                <span>
                  Write Quorum
                </span>

                <strong>
                  2 / 3
                </strong>
              </div>

              <div className="info-row">
                <span>
                  Integrity
                </span>

                <strong>
                  SHA-256
                </strong>
              </div>

              <div className="info-row">
                <span>
                  Recovery
                </span>

                <strong>
                  AUTOMATIC
                </strong>
              </div>
            </motion.div>

          </aside>
        </div>

        {/* FOOTER */}

        <motion.footer
          className="app-footer"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.8,
          }}
        >
          <span>
            VAULT — RESILIENCE OS
          </span>

          <span>
            Distributed Object Storage
          </span>

          <span>
            Gateway • 3 Nodes • PostgreSQL
          </span>
        </motion.footer>

      </main>
    </div>
  );
}

export default App;