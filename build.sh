#!/bin/sh

docker build --pull -t ftl-engine:ci .
docker run --rm ftl-engine:ci bash -c 'npm run test'
