import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import { Mission, FlightPlan, Crew, GroundControl, Supplies, FAQ, Footer } from "./components/Sections";

// Fixed backdrop behind everything. Space fades in as the hatch opens, stars
// drift, and the Earth horizon rises as you approach Ground control.
function Backdrop() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const space = useTransform(scrollYProgress, [0.08, 0.2], [0, 1]);
  const starsY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const earth = useTransform(scrollYProgress, [0.55, 0.78], [0, 1]);
  if (reduce) {
    return (
      <div className="backdrop" aria-hidden="true">
        <div className="space" /><div className="stars" /><div className="earth" style={{ opacity: 0.6 }} />
      </div>
    );
  }
  return (
    <div className="backdrop" aria-hidden="true">
      <motion.div className="space" style={{ opacity: space }} />
      <motion.div className="stars" style={{ opacity: space, y: starsY }} />
      <motion.div className="earth" style={{ opacity: earth }} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Backdrop />
      <Nav />
      <Hero />
      <main>
        <Mission />
        <FlightPlan />
        <Crew />
        <GroundControl />
        <Supplies />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
