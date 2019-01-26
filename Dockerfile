FROM alpine

WORKDIR /code

RUN apk add --update nodejs nodejs-npm docker

RUN npm install -g nodemon

COPY package.json /code/package.json
RUN npm install
RUN mv /code/node_modules /node_modules

COPY . /code

CMD ["npm". "start"]