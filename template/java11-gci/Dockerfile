FROM adoptopenjdk/openjdk11:x86_64-alpine-jdk-11.0.2.9 as builder

RUN apk --no-cache add curl \
    && addgroup -S app && adduser -S -g app app \
    && mkdir -p /opt/ && cd /opt/ \
    && echo "Downloading gradle.." \
    && curl -SfL https://services.gradle.org/distributions/gradle-5.3-bin.zip -o gradle-bin.zip \
    && unzip gradle-bin.zip -d /opt/ \
    && rm gradle-bin.zip \
    && apk del curl

# Export some environment variables
ENV GRADLE_HOME=/opt/gradle-5.3/
ENV PATH=$PATH:$GRADLE_HOME/bin

RUN mkdir -p /home/app/libs

ENV GRADLE_OPTS="-Dorg.gradle.daemon=false"
WORKDIR /home/app

COPY . /home/app/

RUN gradle build --stacktrace

FROM adoptopenjdk/openjdk11:x86_64-alpine-jdk-11.0.2.9 as ship
RUN apk --no-cache add curl \
    && echo "Pulling watchdog binary from Github." \
    && curl -sSL https://github.com/openfaas-incubator/of-watchdog/releases/download/0.4.6/of-watchdog > /usr/bin/fwatchdog \
    && chmod +x /usr/bin/fwatchdog \
    && apk del curl

RUN apk --no-cache add build-base
RUN apk --no-cache add bash
RUN apk --no-cache add musl-dev
RUN ln -f -s /usr/lib/libc.so /lib/libc.musl-x86_64.so.1

RUN addgroup -S app && adduser -S -g app app
WORKDIR /home/app
COPY --from=builder /home/app/entrypoint/build/distributions/entrypoint-1.0.zip ./entrypoint-1.0.zip
RUN unzip ./entrypoint-1.0.zip

RUN chown -R app /home/app
USER app

ENV upstream_url="http://127.0.0.1:8081"
ENV mode="http"
ENV CLASSPATH="/home/app/entrypoint-1.0/lib/*"

RUN mkdir "/home/app/gci"
COPY gci/* /home/app/gci/
ENV PATH_TO_GCI="/home/app/gci"
RUN bash ${PATH_TO_GCI}/libgcso-entrypoint.sh
RUN chmod 777 /home/app/gci/libgc.so

ENV fprocess="java -cp /home/app/entrypoint-1.0/lib/* -XX:+UnlockExperimentalVMOptions -Djava.library.path=/home/app/gci/ -Djvmtilib=/home/app/gci/libgc.so -javaagent:/home/app/gci/gciagent-0.1-jar-with-dependencies.jar=8500 com.openfaas.entrypoint.App"
EXPOSE 8080

HEALTHCHECK --interval=2s CMD [ -e /tmp/.lock ] || exit 1

CMD ["sh","-c","nohup ./gci/gci-proxy --port=8081 --target=127.0.0.1:8082 --gci_target=127.0.0.1:8500 --ygen=67108864 > /tmp/log & fwatchdog"]
