import { motion } from "framer-motion";
import {
  Activity,
  Database,
  HardDrive,
  Shield,
  ShieldCheck,
} from "lucide-react";

function Sidebar({ gatewayError }) {
  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      {/* BRAND */}

      <motion.div
        className="brand"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="brand-icon">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h1>VAULT</h1>
          <span>RESILIENCE OS</span>
        </div>
      </motion.div>

      {/* NAVIGATION */}

      <nav>

        <motion.div
          className="nav-item active"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Activity size={18} />
          Command Center
        </motion.div>

        <motion.div
          className="nav-item"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Database size={18} />
          Storage
        </motion.div>

        <motion.div
          className="nav-item"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <HardDrive size={18} />
          Nodes
        </motion.div>

        <motion.div
          className="nav-item"
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          <Shield size={18} />
          Integrity
        </motion.div>

      </nav>

      {/* CONNECTION STATUS */}

      <div className="sidebar-bottom">

        <motion.div
          className="connection"
          animate={{
            opacity: gatewayError ? 0.65 : [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: gatewayError ? 0 : Infinity,
          }}
        >
          <motion.span
            className="pulse"
            animate={
              gatewayError
                ? { scale: 1 }
                : {
                    scale: [1, 1.25, 1],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: gatewayError ? 0 : Infinity,
            }}
          />

          {gatewayError
            ? "Gateway Offline"
            : "Gateway Connected"}
        </motion.div>

        <small>
          Distributed Object Storage
        </small>

      </div>
    </motion.aside>
  );
}

export default Sidebar;