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

WORKDIR /srv/story-tools-composer
COPY package.json ./
COPY yarn.lock ./
COPY deps ./deps
RUN yarn install

COPY . ./
RUN set -ex; \
    yarn install; \
    yarn run bundle

EXPOSE 9090
ENTRYPOINT ["./docker/run.sh"]
CMD ["--bundle-dev", "--serve-dev"]
