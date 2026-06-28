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

# Cache bust: v2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from Stage 1 to a static dir
COPY --from=frontend-builder /app/frontend/dist /app/static

# Create the static file mount script (appended to main.py at build time)
RUN printf '\nfrom fastapi.staticfiles import StaticFiles\nimport os\nif os.path.exists("/app/static"):\n    app.mount("/", StaticFiles(directory="/app/static", html=True), name="static")\n' >> backend/app/main.py

EXPOSE 8000

# Start Uvicorn using the PORT environment variable provided by Railway (defaults to 8000)
CMD sh -c "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
