ARG NODE_VERSION=18.12.1


FROM --platform=linux/amd64 node:${NODE_VERSION}-slim as base
LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY ./dist ./dist

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data

# Start the server by default, this can be overwritten at runtime
EXPOSE 8080
ENV DATABASE_URL="/data/tiltseeker.db"
CMD [ "npm", "run", "start" ]
