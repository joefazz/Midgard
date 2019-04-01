FROM alpine

RUN apk add --update bash python3 nodejs gcc libc-dev git

RUN adduser -D damien

USER damien

RUN mkdir /home/damien/code

COPY . /home/damien/code

WORKDIR /home/damien/code

USER root

RUN chown -R damien:damien *

USER damien

RUN rm Dockerfile


