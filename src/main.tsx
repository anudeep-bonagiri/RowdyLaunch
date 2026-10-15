import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
import App from "./App";

// /register is the account portal; it is code-split so the event page never
// loads the Supabase client. vercel.json rewrites that path to index.html.
const Portal = lazy(() => import("./components/Portal"));
const page = location.pathname.replace(/\/+$/, "") === "/register"
  ? <Suspense fallback={null}><Portal /></Suspense>
  : <App />;
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation} strict>
      {page}
    </LazyMotion>
  </React.StrictMode>,
);
