#!/bin/sh
set -e

echo "Starting"

for i do # loop over $@
    echo "Executing $i"

    if [ "$i" = "--bundle" ]; then
        cd deps/story-tools
        yarn install
        gulp build
        cd ../..
        yarn install
        yarn run bundle
    fi

    if [ "$i" = "--bundle-dev" ]; then
        cd deps/story-tools
        yarn install
        gulp build watch &
        yarn link
        cd ../..
        yarn install
        yarn link story-tools
        yarn run bundle
    fi

    if [ "$i" = "--dep-upgrade" ]; then
        cd deps/story-tools
        yarn upgrade
        cd ../..
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
