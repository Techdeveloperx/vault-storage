import { motion } from "framer-motion";
import { ShieldCheck, Zap } from "lucide-react";

function ResilienceScore({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  const circumference = 2 * Math.PI * 70;
  const progress = circumference - (safeScore / 100) * circumference;

  const getStatus = () => {
    if (safeScore >= 90) return "EXCELLENT";
    if (safeScore >= 70) return "STABLE";
    if (safeScore >= 40) return "DEGRADED";
    return "CRITICAL";
  };

  return (
    <motion.section
      className="resilience-score-card"
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="score-header">
        <div>
          <span className="eyebrow">RESILIENCE ENGINE</span>
          <h2>Data Safety Score</h2>
        </div>

        <motion.div
          className="score-status"
          animate={{
            opacity: [0.65, 1, 0.65],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Zap size={14} />
          {getStatus()}
        </motion.div>
      </div>

      <div className="score-content">
        <div className="score-ring">

          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
          >
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="10"
            />

            <motion.circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{
                strokeDashoffset: circumference,
              }}
              animate={{
                strokeDashoffset: progress,
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
              transform="rotate(-90 90 90)"
            />
          </svg>

          <div className="score-number">
            <ShieldCheck size={20} />

            <motion.strong
              key={safeScore}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              {safeScore}%
            </motion.strong>

            <span>PROTECTED</span>
          </div>
        </div>

        <div className="score-details">

          <div className="score-detail">
            <span>REPLICATION</span>
            <strong>3×</strong>
          </div>

          <div className="score-detail">
            <span>WRITE QUORUM</span>
            <strong>2 / 3</strong>
          </div>

          <div className="score-detail">
            <span>INTEGRITY</span>
            <strong>SHA-256</strong>
          </div>

          <div className="score-detail">
            <span>RECOVERY</span>
            <strong>AUTO</strong>
          </div>

        </div>
      </div>
    </motion.section>
  );
}

export default ResilienceScore;