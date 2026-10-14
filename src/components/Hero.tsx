import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Airlock from "./Airlock";

// On wide screens the hatch sits right of centre (SVG x = 720 + HATCH_DX) so
// the headline column never crosses the ring. styles.css mirrors the offset
// through --hatch-dx for the sky view and the mascot.
export const HATCH_DX = 150;

function useWide() {
  const [wide, setWide] = useState(() => (typeof window === "undefined" ? true : window.matchMedia("(min-width: 761px)").matches));
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 761px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}
import Countdown from "./Countdown";
import { event } from "../data";

// Scroll choreography (progress 0 to 1 over 260vh):
//   0.00 to 0.30  inside the ship, copy and readout visible
//   0.30 to 0.80  camera pushes through the hatch: porthole grows past the
//                 viewport, bulkheads scale out and fade, copy lifts away
//   0.80 to 1.00  only sky remains, then it hands off to the fixed backdrop
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const wide = useWide();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const hullScale = useTransform(scrollYProgress, [0.3, 0.8], [1, 3.2]);
  const hullOpacity = useTransform(scrollYProgress, [0.55, 0.8], [1, 0]);
  const portScale = useTransform(scrollYProgress, [0.3, 0.8], [1, 4.5]);
  const portOpacity = useTransform(scrollYProgress, [0.66, 0.86], [1, 0]);
  const midOpacity = useTransform(scrollYProgress, [0.5, 0.62, 0.8, 0.92], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.5, 0.92], [30, -30]);
  const copyY = useTransform(scrollYProgress, [0.25, 0.5], [0, -80]);
  const copyOpacity = useTransform(scrollYProgress, [0.25, 0.45], [1, 0]);
  const mascotY = useTransform(scrollYProgress, [0.3, 0.7], [0, 240]);
  const mascotOpacity = useTransform(scrollYProgress, [0.5, 0.7], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const still = reduce ? { scale: 1, opacity: 1, y: 0 } : undefined;

  return (
    <section className="hero" ref={ref} id="top" aria-label="RowdyLaunch Hacktoberfest Hack Day">
      <div className="pin">
        <div className="scene">
          <motion.div className="porthole-view" style={still ?? { scale: portScale, opacity: portOpacity }} aria-hidden="true">
            <span className="cloud" style={{ width: "46%", height: "16%", left: "0%", top: "28%", animationDuration: "38s" }} />
            <span className="cloud" style={{ width: "34%", height: "12%", left: "20%", top: "56%", animationDuration: "52s", animationDelay: "-20s" }} />
            <span className="cloud" style={{ width: "28%", height: "10%", left: "-10%", top: "72%", animationDuration: "44s", animationDelay: "-9s" }} />
          </motion.div>

          <motion.div style={still ?? { scale: hullScale, opacity: hullOpacity, position: "absolute", inset: 0 }} aria-hidden="true">
            <Airlock cx={720 + (wide ? HATCH_DX : 0)} />
          </motion.div>

          <motion.img
            className="mascot"
            src="/mascot.png"
            alt=""
            width={190}
            height={190}
            style={still ?? { y: mascotY, opacity: mascotOpacity }}
          />
        </div>

        <motion.div className="copy" style={still ?? { y: copyY, opacity: copyOpacity }}>
          <div className="title">
            <span className="eyebrow">Hacktoberfest 2026 · San Antonio</span>
            <h1>
              RowdyLaunch
              <span>Hack Day at UTSA</span>
            </h1>
            <p>
              One Saturday, one room, a lot of pull requests. Pick an open-source issue, ship a fix, and leave
              with your first Hacktoberfest contribution and a crew to build with after.
            </p>
            <div className="actions">
              <a className="btn primary" href={event.registerUrl} target="_blank" rel="noopener">
                Board the mission
              </a>
              <a className="btn ghost" href="#mission">
                Read the brief
              </a>
            </div>
          </div>
          <Countdown />
        </motion.div>

        <motion.div className="midline" style={still ? { opacity: 0 } : { opacity: midOpacity, y: midY }} aria-hidden="true">
          <span>Hatch open</span>
          <h2>Next stop: your first merged pull request.</h2>
        </motion.div>

        <motion.div className="scroll-cue" style={still ?? { opacity: cueOpacity }} aria-hidden="true">
          Scroll to open the hatch
        </motion.div>
      </div>
    </section>
  );
}
