FROM node:22-alpine

WORKDIR /app

#Npm hat im lokalen eine package.json die für frontend und backend gilt,
#hier möchten wir nur die information für den frontend haben. Also ändern wir es! 
RUN echo '{"name":"frontend-app","private":true,"workspaces":["frontend","utils"]}' > package.json

COPY frontend/package.json frontend/
COPY utils/package.json utils/

RUN npm install

COPY frontend/ frontend/
COPY utils/ utils/

WORKDIR /app/frontend

EXPOSE 5173