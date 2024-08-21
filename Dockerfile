# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy the root package.json and package-lock.json files
COPY package*.json ./

# Install root dependencies (like concurrently and serve)
RUN npm install

# Copy the backend and frontend directories into the container
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies and build the frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Set the working directory back to /app
WORKDIR /app

# Start both backend and frontend
CMD ["npm", "start"]

# Expose the port your frontend will run on
EXPOSE 3000

# Expose the port your backend will run on (if it's different)
EXPOSE 5000
