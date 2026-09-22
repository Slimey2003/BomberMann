FROM node:22-alpine AS frontend-build
WORKDIR /app
RUN echo '{"name":"frontend-app","private":true,"workspaces":["frontend","utils"]}' > package.json
COPY frontend/package.json frontend/
COPY utils/package.json utils/
RUN npm install --legacy-peer-deps
COPY frontend/ frontend/
COPY utils/ utils/
WORKDIR /app/frontend

ARG VITE_KC_GAME_ID
ARG VITE_KC_REALM
ARG VITE_GAME_PORT
ARG VITE_IS_DEV

ENV VITE_KC_GAME_ID=$VITE_KC_GAME_ID
ENV VITE_KC_REALM=$VITE_KC_REALM
ENV VITE_GAME_PORT=$VITE_GAME_PORT
ENV VITE_IS_DEV=$VITE_IS_DEV

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