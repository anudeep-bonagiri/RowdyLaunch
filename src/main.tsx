import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import App from "./App";
import "./styles.css";

// /register and /organizer are the account portal; it is code-split so the
// event page never loads the Supabase client. vercel.json rewrites both
// paths to index.html.
const Portal = lazy(() => import("./components/Portal"));
const path = location.pathname.replace(/\/+$/, "");
const page = path === "/register" || path === "/organizer"
  ? <Suspense fallback={null}><Portal view={path === "/organizer" ? "organizer" : "attendee"} /></Suspense>
  : <App />;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation} strict>
      {page}
    </LazyMotion>
  </React.StrictMode>,
);
