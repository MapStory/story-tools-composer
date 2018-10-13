FROM node:10.12-alpine
LABEL maintainer="Tyler Battle <tbattle@boundlessgeo.com>"

ARG DEPLOYMENT=production
ARG NODE_ENV=$DEPLOYMENT
ENV NODE_ENV=$DEPLOYMENT

# Install build tools
RUN apk add --no-cache \
    git \
    yarn \
    ;

# Install Gulp for story-tools
RUN yarn global add gulpjs/gulp.git#4.0

WORKDIR /srv/story-tools-composer

ENV COMPOSER_BUNDLE_ARGS=

COPY . ./

RUN set -ex; \
    mkdir -p /tmp/story-tools/node_modules; \
    mkdir -p /tmp/story-tools-composer/node_modules; \
    ./scripts/run.sh --bundle; \
    mv ./node_modules /tmp/story-tools-composer/; \
    mv ./deps/story-tools/node_modules /tmp/story-tools/;

# Symlink for eslint
RUN ln -s /srv/story-tools-composer/node_modules/eslint/bin/eslint.js /usr/local/bin/eslint

EXPOSE 9090
ENTRYPOINT ["./scripts/run.sh"]
CMD ["--bundle-dev", "--serve-dev"]
