FROM alpine

RUN apk add --update bash python3 nodejs gcc libc-dev git

RUN adduser -D damien

USER damien

RUN mkdir /home/damien/code

WORKDIR /home/damien/code

COPY . /home/damien/code
