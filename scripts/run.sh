#!/bin/bash
set -e

echo "Starting"

# Populate node_modules in story-tools-composer if it's missing.
# If running during a docker build, the dirs are just empty.
if [ ! -d "./node_modules" ]; then
    cp -r /tmp/story-tools-composer/node_modules ./
fi
# And for composer's story-tools
if [ ! -d "./deps/story-tools/node_modules" ]; then
    cp -r /tmp/story-tools/node_modules ./deps/story-tools/
fi

for i do # loop over $@
    echo "Executing $i"

    if [ "$i" = "--bundle" ]; then
        pushd deps/story-tools
        yarn install
        yarn run gulp build
        popd
        yarn install
        yarn run bundle $COMPOSER_BUNDLE_ARGS
    fi

    if [ "$i" = "--bundle-dev" ]; then
        pushd deps/story-tools
        yarn install
        yarn run gulp build
        #yarn link
        popd
        yarn install
        #yarn link story-tools
        yarn run bundle $COMPOSER_BUNDLE_ARGS
    fi

    if [ "$i" = "--dep-upgrade" ]; then
        pushd deps/story-tools
        yarn upgrade
        popd
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
        /bin/bash
    fi
done

echo "Finished"
