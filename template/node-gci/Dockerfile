FROM node:8.9.1-alpine

ARG WATCHDOG_VERSION=0.5.1

RUN addgroup -S app && adduser app -S -G app
RUN apk --no-cache add curl \
    && echo "Pulling watchdog binary from Github." \
    && curl -sSL https://github.com/openfaas-incubator/of-watchdog/releases/download/$WATCHDOG_VERSION/of-watchdog > /usr/bin/fwatchdog \
    && chmod +x /usr/bin/fwatchdog \
    && apk del curl --no-cache

WORKDIR /root/

# Turn down the verbosity to default level.
ENV NPM_CONFIG_LOGLEVEL warn

RUN mkdir -p /home/app

# Wrapper/boot-strapper
WORKDIR /home/app
COPY package.json ./

# This ordering means the npm installation is cached for the outer function handler.
RUN npm i --production

# Copy outer function handler
COPY index.js ./
COPY gcinterceptor.js ./
COPY gci-proxy ./

# COPY function node packages and install, adding this as a separate
# entry allows caching of npm install runtime dependencies
WORKDIR /home/app/function
COPY function/*.json ./
RUN npm i --production || :

# Copy in additional function files and folders
COPY --chown=app:app function/ .

WORKDIR /home/app/

# chmod for tmp is for a buildkit issue (@alexellis)
RUN chmod +rx -R ./function \
    && chown app:app -R /home/app \
    && chmod 777 /tmp

USER app

ENV mode="http"
ENV NODE_ENV="production"
ENV YOUNG_GEN_SIZE_MB="256"
ENV YOUNG_GEN_SIZE_B="256000000"
ENV EXPRESS_PORT="8083"
ENV PROXY_PORT="8082"
ENV upstream_url="http://127.0.0.1:${PROXY_PORT}"
ENV fprocess="node --expose-gc --nouse_idle_notification --noconcurrent_sweeping --semi_space_growth_factor=0 --min_semi_space_size=${YOUNG_GEN_SIZE_MB} --max_semi_space_size=${YOUNG_GEN_SIZE_MB} index.js"
EXPOSE 8080

HEALTHCHECK --interval=2s CMD [ -e /tmp/.lock ] || exit 1

CMD ["sh","-c","nohup ./gci-proxy --port=${PROXY_PORT} --target=127.0.0.1:${EXPRESS_PORT} --gci_target=127.0.0.1:${EXPRESS_PORT} --gci_path=__gci --ygen=${YOUNG_GEN_SIZE_B} > /tmp/log & fwatchdog"]
