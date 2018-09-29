FROM node:9
LABEL maintainer="Tyler Battle <tbattle@boundlessgeo.com>"

# Install SSL/TLS support
RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        ; \
    rm -rf /var/lib/apt/lists/*;

# Install yarn
RUN set -ex; \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -; \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        yarn \
        ; \
    rm -rf /var/lib/apt/lists/*;

# Install Gulp for story-tools
RUN yarn global add gulp-cli

WORKDIR /srv/story-tools-composer

ENV COMPOSER_BUNDLE_ARGS=

COPY . ./
RUN set -ex; \
    ./scripts/run.sh --bundle; \
    mkdir /tmp/story-tools-composer/; \
    mv ./node_modules /tmp/story-tools-composer/; \
    mkdir /tmp/story-tools/; \
    mv ./deps/story-tools/node_modules /tmp/story-tools/;

 # Symlink for eslint
RUN ln -s /srv/story-tools-composer/node_modules/eslint/bin/eslint.js /usr/local/bin/eslint

EXPOSE 9090
ENTRYPOINT ["./scripts/run.sh"]
CMD ["--bundle-dev", "--serve-dev"]
