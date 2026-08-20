FROM node:22-alpine

WORKDIR /app

#Npm hat im lokalen eine package.json die für frontend und backend gilt,
#hier möchten wir nur die information für den backend haben. Also ändern wir es! 
RUN echo '{"name":"server-app","private":true,"workspaces":["backend","utils"]}' > package.json 

COPY server/package.json backend/
COPY utils/package.json utils/

RUN npm install

COPY backend/ backend/
COPY utils/ utils/

WORKDIR /app/backend

EXPOSE 3001