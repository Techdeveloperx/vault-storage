import { motion } from "framer-motion";
import { Activity, Database, Network } from "lucide-react";
import NodeCard from "./NodeCard";

function ClusterTopology({ nodes = [] }) {
  const gatewayNode = {
    name: "GATEWAY",
    location: "API Layer",
    status: "healthy",
    latency: "LIVE",
    replicas: "QUORUM",
  };

  return (
    <section className="topology-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DISTRIBUTED TOPOLOGY</span>
          <h2>Cluster Network</h2>
          <p>
            Live communication path between gateway and storage nodes
          </p>
        </div>

        <motion.div
          className="live-indicator"
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
          }}
        >
          <Activity size={14} />
          LIVE
        </motion.div>
      </div>

      <div className="topology">

        {/* GATEWAY */}

        <motion.div
          className="gateway-node"
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <motion.div
            className="gateway-icon"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Network size={28} />
          </motion.div>

          <strong>{gatewayNode.name}</strong>

          <span>{gatewayNode.location}</span>

          <div className="gateway-status">
            <span />
            {gatewayNode.status.toUpperCase()}
          </div>
        </motion.div>

        {/* CONNECTION AREA */}

        <div className="topology-connections">

          {nodes.map((node, index) => {
            const isHealthy = node.status === "healthy";

            return (
              <motion.div
                className="connection-row"
                key={node.id || node.name || index}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: 0.4 + index * 0.15,
                }}
              >

                {/* CONNECTION LINE */}

                <div className="connection-line">

                  <motion.div
                    className={`data-packet ${
                      isHealthy ? "active" : "inactive"
                    }`}
                    animate={
                      isHealthy
                        ? {
                            left: ["0%", "100%"],
                            opacity: [0, 1, 1, 0],
                          }
                        : {
                            opacity: 0,
                          }
                    }
                    transition={
                      isHealthy
                        ? {
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.35,
                            ease: "linear",
                          }
                        : {}
                    }
                  />

                </div>

                {/* NODE */}

                <NodeCard node={node} index={index} />

              </motion.div>
            );
          })}

          {nodes.length === 0 && (
            <motion.div
              className="empty-topology"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Database size={20} />
              <span>Waiting for storage nodes...</span>
            </motion.div>
          )}

        </div>
      </div>
    </section>
  );
}

export default ClusterTopology;