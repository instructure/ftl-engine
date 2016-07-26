#!/bin/bash

# their might be better ways to do this with cp --parents, but OSX sucks, so we just do it hacky
copyWithPath() {
  local newDir=`dirname ${2}${1}`
  mkdir -p $newDir
  cp $1 ${2}/${1}
}
export -f copyWithPath
set -e
find src -type f -not -name "*.ts" -exec bash -c 'copyWithPath "$0" build/' {} \;

