import { serve } from "bun";
import index from "./index.html";
import admin from "./admin.html";
import { isBehindTrustedProxy, resolveClientKey } from "./server/client-ip";
import { handleListVehicles, handleRevalidate } from "./server/vehicles";

const trustProxy = isBehindTrustedProxy();

const notFound = () => Response.json({ success: false, error: "Not found" }, { status: 404 });

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes; the client router takes over.
    "/*": index,

    "/admin": admin,
    "/admin/*": admin,

    "/api/vehicles": {
      async GET(req, server) {
        const clientKey = resolveClientKey(req.headers, server.requestIP(req)?.address, trustProxy);
        return handleListVehicles(req, clientKey);
      },
    },

    "/api/admin/revalidate": {
      async POST(req, server) {
        const clientKey = resolveClientKey(req.headers, server.requestIP(req)?.address, trustProxy);
        return handleRevalidate(req, clientKey);
      },
    },

    // Catch-all for any other /api/* path or method: JSON 404, not the HTML shell.
    "/api/*": notFound,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 HP Auto running at ${server.url}`);
