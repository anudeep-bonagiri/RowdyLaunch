import { m, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Rsvp from "./components/Rsvp";
import { Mission, FlightPlan, Crew, GroundControl, Supplies, FAQ, Footer } from "./components/Sections";

// Fixed backdrop behind everything. Space fades in as the hatch opens, two
// star layers drift at different rates, and the Earth climbs into frame as
// you approach Ground control. Opacity is capped so body text stays legible
// where it crosses the horizon.
function Backdrop() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const space = useTransform(scrollYProgress, [0.08, 0.2], [0, 1]);
  const starsY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const stars2Y = useTransform(scrollYProgress, [0, 1], ["0%", "-9%"]);
  const earth = useTransform(scrollYProgress, [0.5, 0.82], [0, 0.75]);
  const earthY = useTransform(scrollYProgress, [0.5, 0.95], ["26%", "0%"]);
  if (reduce) {
    return (
      <div className="backdrop" aria-hidden="true">
        <div className="space" /><div className="stars" /><div className="stars-2" /><div className="earth" style={{ opacity: 0.6 }} />
      </div>
    );
  }
  return (
    <div className="backdrop" aria-hidden="true">
      <m.div className="space" style={{ opacity: space }} />
      <m.div className="stars" style={{ opacity: space, y: starsY }} />
      <m.div className="stars-2" style={{ opacity: space, y: stars2Y }} />
      <m.div className="earth" style={{ opacity: earth, y: earthY }} />
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
        <Rsvp />
        <Crew />
        <GroundControl />
        <Supplies />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
