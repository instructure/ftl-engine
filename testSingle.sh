#!/bin/sh
set -e
shouldCompile=${COMPILE_TSC:-false}
if [ "$shouldCompile" = true ]; then
  echo 'compiling...'
  compileOut=`npm run build`
  if [ $? -ne 0 ]; then
    echo "Failed to compile code"
    echo $compileOut
    exit
  fi
fi
targetScript=${1/.ts/.js}
shift;
./node_modules/.bin/mocha --require source-map-support/register build/$targetScript $@
