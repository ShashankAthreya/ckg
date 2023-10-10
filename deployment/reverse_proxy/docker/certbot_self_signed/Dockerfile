FROM certbot/certbot:v2.6.0

WORKDIR /app

ENV DOMAINS=""

COPY gen_self_signed.sh ./
RUN chmod +x ./gen_self_signed.sh

ENTRYPOINT ["./gen_self_signed.sh"]