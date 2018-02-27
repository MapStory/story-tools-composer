#!/bin/sh
set -e

echo "Starting"

for i do # loop over $@
    echo "Executing $i"

    if [ "$i" = "--bundle" ]; then
        yarn install
        yarn run bundle
    fi

    if [ "$i" = "--bundle-dev" ]; then
        yarn install
        cd deps/story-tools
        yarn link
        cd ../..
        yarn link story-tools
        yarn run bundle
    fi

    if [ "$i" = "--dep-upgrade" ]; then
        yarn upgrade
    fi

    if [ "$i" = "--test" ]; then
        yarn run test
    fi

    if [ "$i" = "--serve-dev" ]; then
        yarn run server --host 0.0.0.0 --watch  --disable-host-check
    fi

    if [ "$i" = "--shell" ]; then
        /bin/bash
    fi
done

echo "Finished"
