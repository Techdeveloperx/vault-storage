import { motion } from "framer-motion";
import {
  ShieldCheck,
  Database,
  HardDrive,
  HeartPulse,
} from "lucide-react";

function MetricsGrid({
  safetyScore,
  totalFiles,
  totalReplicas,
}) {
  const metrics = [
    {
      label: "DATA SAFETY",
      value: `${safetyScore}%`,
      description:
        safetyScore === 100
          ? "Fully protected"
          : "Reduced redundancy",
      icon: ShieldCheck,
      highlight: true,
    },
    {
      label: "OBJECTS STORED",
      value: totalFiles,
      description: "Distributed objects",
      icon: Database,
    },
    {
      label: "REPLICAS",
      value: totalReplicas,
      description: "Redundant copies",
      icon: HardDrive,
    },
    {
      label: "QUORUM",
      value: "2 / 3",
      description: "Read / Write policy",
      icon: HeartPulse,
    },
  ];

  return (
    <section className="metrics-grid">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;

        return (
          <motion.div
            key={metric.label}
            className={`metric-card ${
              metric.highlight ? "highlight" : ""
            }`}
            initial={{
              opacity: 0,
              y: 25,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.45,
              delay: index * 0.1,
              ease: "easeOut",
            }}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
          >
            <motion.div
              className="metric-icon"
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1 + 0.15,
              }}
            >
              <Icon size={22} />
            </motion.div>

            <div>
              <span>{metric.label}</span>

              <motion.strong
                key={metric.value}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {metric.value}
              </motion.strong>

              <small>{metric.description}</small>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}

export default MetricsGrid;