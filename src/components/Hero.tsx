import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Airlock from "./Airlock";
import Countdown from "./Countdown";
import { event } from "../data";

// Scroll choreography (progress 0 to 1 over 260vh). Everything scales around
// the hatch, which sits dead centre of the viewport.
//   0.00 to 0.30  at rest: wordmark above the hatch, button below it
//   0.30 to 0.80  push through the hatch: sky grows past the viewport,
//                 bulkheads scale out and fade, copy lifts away
//   0.50 to 0.92  "hatch open" line drifts through
//   0.86 onward   fixed backdrop takes over
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const hullScale = useTransform(scrollYProgress, [0.3, 0.8], [1, 3.2]);
  const hullOpacity = useTransform(scrollYProgress, [0.55, 0.8], [1, 0]);
  const portScale = useTransform(scrollYProgress, [0.3, 0.8], [1, 4.5]);
  const portOpacity = useTransform(scrollYProgress, [0.66, 0.86], [1, 0]);
  const topY = useTransform(scrollYProgress, [0.25, 0.5], [0, -60]);
  const topOpacity = useTransform(scrollYProgress, [0.25, 0.42], [1, 0]);
  const bottomY = useTransform(scrollYProgress, [0.25, 0.5], [0, 60]);
  const midOpacity = useTransform(scrollYProgress, [0.5, 0.62, 0.8, 0.92], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.5, 0.92], [30, -30]);

  const still = reduce ? { scale: 1, opacity: 1, y: 0 } : undefined;

  return (
    <section className="hero" ref={ref} id="top" aria-label="RowdyLaunch Hacktoberfest Hack Day">
      <div className="pin">
        <div className="scene">
          <motion.div className="porthole-view" style={still ?? { scale: portScale, opacity: portOpacity }} aria-hidden="true">
            <span className="cloud" style={{ width: "46%", height: "16%", left: "0%", top: "26%", animationDuration: "38s" }} />
            <span className="cloud" style={{ width: "34%", height: "12%", left: "20%", top: "58%", animationDuration: "52s", animationDelay: "-20s" }} />
            <span className="cloud" style={{ width: "28%", height: "10%", left: "-10%", top: "74%", animationDuration: "44s", animationDelay: "-9s" }} />
            <img className="mascot" src="/mascot.png" alt="" width={170} height={170} />
          </motion.div>

          <motion.div style={still ?? { scale: hullScale, opacity: hullOpacity, position: "absolute", inset: 0 }} aria-hidden="true">
            <Airlock />
          </motion.div>
        </div>

        <div className="copy">
          <motion.div className="top" style={still ?? { y: topY, opacity: topOpacity }}>
            <h1>RowdyLaunch</h1>
            <p className="when">
              Hacktoberfest Hack Day · {event.dateLabel} · UTSA
            </p>
          </motion.div>
          <motion.div className="bottom" style={still ?? { y: bottomY, opacity: topOpacity }}>
            <a className="btn primary lg" href={event.registerUrl} target="_blank" rel="noopener">
              Register on MLH
            </a>
            <Countdown compact />
          </motion.div>
        </div>

        <motion.div className="midline" style={still ? { opacity: 0 } : { opacity: midOpacity, y: midY }} aria-hidden="true">
          <span>Hatch open</span>
          <h2>Seven hours to your first merged pull request.</h2>
        </motion.div>
      </div>
    </section>
  );
}
