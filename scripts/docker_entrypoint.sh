#!/bin/sh

if [ ! -d "node_modules" ]; then
  cp /tmp/story-tools-composer/node_modules ./
fi

if [ ! -d "deps/story-tools/node_modules" ]; then
  cp /tmp/story-tools/node_modules ./deps/story-tools/
fi

./scripts/run.sh $@
