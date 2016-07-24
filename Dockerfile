FROM instructure/node:6

USER root

RUN mkdir -p /usr/src/app && chown docker /usr/src/app
WORKDIR /usr/src/app

USER docker

COPY package.json typings.json tsconfig.json /usr/src/app/
RUN npm install .
COPY . /usr/src/app

USER root
RUN chown -R docker .
USER docker
RUN npm run build


