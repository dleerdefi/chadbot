FROM python:3.10-slim AS python-base

RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app

COPY frontend/package.json ./frontend/
RUN cd frontend && npm install --force

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/package.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app/backend

CMD ["npm", "start"]