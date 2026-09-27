/**
 * Entry point for the admin app, mirroring src/frontend.tsx. Included by src/admin.html.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "./AdminApp";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <AdminApp />
  </StrictMode>
);

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
