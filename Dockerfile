# HP Auto production image (Render, or any Docker host).
# Bun bundles src/index.html + src/admin.html at startup, so the whole src/ tree and the
# Tailwind plugin (a devDependency) must be present at runtime: no separate build stage.
FROM oven/bun:1.4.2-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --chown=bun:bun . .

USER bun
# Bun.serve reads PORT (Render injects it); 3000 is the local default.
EXPOSE 3000
CMD ["bun", "src/index.ts"]
