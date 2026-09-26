import { motion } from "framer-motion";
import {
  CheckCircle2,
  HardDrive,
  XCircle,
} from "lucide-react";

function NodeCard({ node, index }) {
  const isHealthy = node.status === "healthy";

  return (
    <motion.div
      className={`storage-node ${node.status}`}
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
        delay: index * 0.12,
        ease: "easeOut",
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      layout
    >
      {/* STATUS DOT */}

      <motion.div
        className="node-status-dot"
        animate={
          isHealthy
            ? {
                scale: [1, 1.25, 1],
                opacity: [0.7, 1, 0.7],
              }
            : {
                scale: 1,
                opacity: 0.5,
              }
        }
        transition={{
          duration: 1.8,
          repeat: isHealthy ? Infinity : 0,
        }}
      />

      {/* NODE ICON */}

      <motion.div
        className="node-icon"
        animate={
          isHealthy
            ? {
                boxShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 18px rgba(255,255,255,0.12)",
                  "0 0 0px rgba(255,255,255,0)",
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: isHealthy ? Infinity : 0,
        }}
      >
        <HardDrive size={25} />
      </motion.div>

      {/* NODE NAME */}

      <strong>{node.name}</strong>

      <span>{node.location}</span>

      {/* NODE STATS */}

      <div className="node-stats">
        <span>{node.latency}</span>

        <span>
          {node.replicas} replicas
        </span>
      </div>

      {/* STATUS */}

      <motion.div
        className="node-state"
        key={node.status}
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.25,
        }}
      >
        {isHealthy ? (
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
      </motion.div>
    </motion.div>
  );
}

export default NodeCard;