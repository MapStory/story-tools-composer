#!/bin/sh
set -e

echo "Starting"

for i do # loop over $@
    echo "Executing $i"

    if [ "$i" = "--bundle" ]; then
        echo "bundling story-tools for prod"
        cd deps/story-tools
        yarn install --production=false
        yarn run gulp build
        cd ../..
        echo "bundling composer for prod"
        yarn install --production=false
        yarn run bundle $COMPOSER_BUNDLE_ARGS
    fi

    if [ "$i" = "--bundle-dev" ]; then
        echo "bundling story-tools for dev"
        cd deps/story-tools
        yarn install --production=false
        yarn run gulp build
        yarn link
        cd ../..
        echo "bundling composer for dev"
        yarn install --production=false
        yarn link story-tools
        yarn run bundle $COMPOSER_BUNDLE_ARGS
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

    if [ "$i" = "--lint" ]; then
        yarn run lint
    fi

    if [ "$i" = "--lint-fix" ]; then
        yarn run lint-fix
    fi

    if [ "$i" = "--serve-dev" ]; then
        yarn run server --host 0.0.0.0 --watch --disable-host-check
    fi

    if [ "$i" = "--shell" ]; then
        /bin/sh
    fi
done

echo "Finished"
