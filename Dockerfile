FROM node:22-alpine AS frontend-build
WORKDIR /app
RUN echo '{"name":"frontend-app","private":true,"workspaces":["frontend","utils"]}' > package.json
COPY frontend/package.json frontend/
COPY utils/package.json utils/
RUN npm install --legacy-peer-deps
COPY frontend/ frontend/
COPY utils/ utils/
WORKDIR /app/frontend
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN echo '{"name":"server-app","private":true,"workspaces":["backend","utils"]}' > package.json
COPY backend/package.json backend/
COPY utils/package.json utils/
RUN npm install --legacy-peer-deps
COPY backend/ backend/
COPY utils/ utils/
COPY --from=frontend-build /app/frontend/dist /app/backend/public
WORKDIR /app/backend
EXPOSE 3001
CMD ["npm", "start"]