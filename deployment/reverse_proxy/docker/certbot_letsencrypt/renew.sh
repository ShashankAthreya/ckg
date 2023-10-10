#!/bin/sh
set -e

run_certbot() {
  domain="$1"
  certbot certonly \
    --standalone \
    --preferred-challenges http \
    --http-01-port 80 \
    --non-interactive \
    --agree-tos \
    --email gabriel.pelouze@lifewatch.eu \
    -d "${domain}"
}

gen_haproxy_cert () {
  domain="$1"
  if [ -f "/etc/letsencrypt/live/${domain}/privkey.pem" ]
  then
    cat "/etc/letsencrypt/live/${domain}/fullchain.pem" \
        "/etc/letsencrypt/live/${domain}/privkey.pem" \
        > "/etc/ssl/private/${domain}.pem"
  fi
}

load_haproxy_cert () {
  domain="$1"
  pem_file="/etc/ssl/private/${domain}.pem"
  echo -e "set ssl cert $pem_file <<\n$(cat "$pem_file")\n" | socat tcp-connect:haproxy:9999 -
  echo "commit ssl cert $pem_file" | socat tcp-connect:haproxy:9999 -
  echo "abort ssl cert $pem_file" | socat tcp-connect:haproxy:9999 -
}

main() {
  echo "${DOMAINS}" | tr ';' '\n' | while read -r domain
  do
    run_certbot "$domain"
    gen_haproxy_cert "$domain"
    load_haproxy_cert "$domain"
  done
}


main