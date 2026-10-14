import { useEffect, useRef, useState } from "react";
import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Airlock from "./Airlock";
import Countdown, { useEventPhase } from "./Countdown";
import { event } from "../data";

function usePhone() {
  const [phone, setPhone] = useState(() => (typeof window === "undefined" ? false : window.matchMedia("(max-width: 760px)").matches));
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

// Scroll choreography (progress 0 to 1 over the hero's height). Everything
// scales around the hatch, which sits dead centre of the viewport.
//   0.00 to 0.30  at rest: wordmark above the hatch, button below it
//   0.30 to 0.80  push through the hatch: sky grows past the viewport,
//                 bulkheads scale out and fade, copy lifts away
//   0.50 to 0.92  "hatch open" line drifts through
//   0.86 onward   fixed backdrop takes over
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const phone = usePhone();
  const phase = useEventPhase();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // phones raster at 3x DPR; cap the push so the layer never exceeds ~2x the viewport
  const hullScale = useTransform(scrollYProgress, [0.3, 0.8], [1, phone ? 2.1 : 3.2]);
  const hullOpacity = useTransform(scrollYProgress, [0.55, 0.8], [1, 0]);
  const portScale = useTransform(scrollYProgress, [0.3, 0.8], [1, phone ? 3 : 4.5]);
  const portOpacity = useTransform(scrollYProgress, [0.66, 0.86], [1, 0]);
  const topY = useTransform(scrollYProgress, [0.25, 0.5], [0, -60]);
  const bottomY = useTransform(scrollYProgress, [0.25, 0.5], [0, 60]);
  const copyOpacity = useTransform(scrollYProgress, [0.25, 0.42], [1, 0]);
  // keep faded copy out of the tab order and the accessibility tree
  const copyVis = useTransform(copyOpacity, (o) => (o <= 0.01 ? "hidden" : "visible"));
  const midOpacity = useTransform(scrollYProgress, [0.5, 0.62, 0.8, 0.92], [0, 1, 1, 0]);
  const midY = useTransform(scrollYProgress, [0.5, 0.92], [30, -30]);

  const still = reduce ? { scale: 1, opacity: 1, y: 0 } : undefined;

  return (
    <section className="hero" ref={ref} id="top" aria-label="RowdyLaunch Hacktoberfest Hack Day">
      <div className="pin">
        <div className="scene">
          <m.div className="porthole-view" style={still ?? { scale: portScale, opacity: portOpacity }} aria-hidden="true">
            <span className="cloud" style={{ width: "46%", height: "16%", left: "0%", top: "26%", animationDuration: "38s" }} />
            <span className="cloud" style={{ width: "34%", height: "12%", left: "20%", top: "58%", animationDuration: "52s", animationDelay: "-20s" }} />
            <span className="cloud" style={{ width: "28%", height: "10%", left: "-10%", top: "74%", animationDuration: "44s", animationDelay: "-9s" }} />
            <img className="mascot" src="/mascot.png" alt="" width={896} height={896} />
          </m.div>

          <m.div className="hull" style={still ?? { scale: hullScale, opacity: hullOpacity }} aria-hidden="true">
            <Airlock />
          </m.div>
        </div>

        <div className="copy">
          <m.div className="top" style={still ?? { y: topY, opacity: copyOpacity, visibility: copyVis }}>
            <h1>RowdyLaunch</h1>
            <p className="when">Hacktoberfest Hack Day · {event.dateLabel} · UTSA</p>
          </m.div>
          <m.div className="bottom" style={still ?? { y: bottomY, opacity: copyOpacity, visibility: copyVis }}>
            {phase === "over" ? (
              <a className="btn primary lg" href={event.postEventUrl} target="_blank" rel="noopener">See what we shipped</a>
            ) : (
              <a className="btn primary lg" href={event.registerUrl} target="_blank" rel="noopener" aria-label="Register on MLH, opens in a new tab">
                Register on MLH
              </a>
            )}
            <Countdown compact />
          </m.div>
        </div>

        <m.div className="midline" style={still ? { opacity: 0 } : { opacity: midOpacity, y: midY }} aria-hidden="true">
          <span>Hatch open</span>
          <h2>Open your first pull request by five.</h2>
        </m.div>
      </div>
    </section>
  );
}
