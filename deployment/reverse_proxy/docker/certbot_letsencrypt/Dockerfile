FROM certbot/certbot:v2.6.0

WORKDIR /app

ENV DOMAINS=""

COPY entrypoint.sh renew.sh ./
RUN chmod +x ./entrypoint.sh ./renew.sh
RUN ln -s /app/renew.sh /etc/periodic/daily/renew

RUN apk -U --no-cache upgrade \
    && apk --no-cache add socat

ENTRYPOINT ["./entrypoint.sh"]