FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy dependencies
COPY lib/ ./lib/
COPY artifacts/unipath-mis/ ./artifacts/unipath-mis/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install dependencies and build
# Note: copying api-server to allow typecheck/api-zod to work smoothly in monorepo setup if needed
RUN pnpm install --frozen-lockfile
RUN cd artifacts/unipath-mis && pnpm run build

FROM nginx:alpine

# Copy built assets to nginx serve directory
COPY --from=builder /app/artifacts/unipath-mis/dist /usr/share/nginx/html

# Copy custom nginx configuration for SPA routing
COPY artifacts/unipath-mis/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
