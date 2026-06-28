# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + Serve Static
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 to a static dir
COPY --from=frontend-builder /app/frontend/dist /app/static

# Modify FastAPI to serve static files if running from Docker
# This is a one-line addition to main.py to mount the frontend
RUN echo '\nfrom fastapi.staticfiles import StaticFiles\nfrom fastapi.responses import FileResponse\nimport os\nif os.path.exists("/app/static"):\n    app.mount("/", StaticFiles(directory="/app/static", html=True), name="static")\n' >> backend/app/main.py

EXPOSE 8000

# Start Uvicorn using the PORT environment variable provided by Railway (defaults to 8000)
CMD sh -c "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
