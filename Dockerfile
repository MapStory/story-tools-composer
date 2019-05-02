FROM node:10-stretch

ARG DEPLOYMENT=production
ARG NODE_ENV=$DEPLOYMENT
ENV NODE_ENV=$DEPLOYMENT

# Install SSL/TLS support
RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        ; \
    rm -rf /var/lib/apt/lists/*;

# Install Gulp for story-tools
RUN yarn global add gulpjs/gulp.git#4.0

WORKDIR /srv/story-tools-composer

ENV COMPOSER_BUNDLE_ARGS=

COPY . ./

RUN ./scripts/run.sh --bundle

# Symlink for eslint
RUN ln -s /srv/story-tools-composer/node_modules/eslint/bin/eslint.js /usr/local/bin/eslint

EXPOSE 9090
ENTRYPOINT ["./scripts/run.sh"]
CMD ["--bundle-dev", "--serve-dev"]
