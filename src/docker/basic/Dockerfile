FROM alpine

WORKDIR /code

RUN apk add --update bash python3 nodejs gcc libc-dev git

COPY . /code

RUN rm Dockerfile