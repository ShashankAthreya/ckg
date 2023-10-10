#!/bin/sh
set -e

gen_self_signed_cert () {
  domain="$1"
  if [ -f "/etc/ssl/private/${domain}.pem" ]
  then
    echo "Certificate already exists for domain(s) ${domain}"
    return
  fi

  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:4096 \
    -days 1 \
    -out "${domain}_fullchain.pem" \
    -keyout "${domain}_privkey.pem" \
    -subj "/CN=${domain}"

  cat "${domain}_fullchain.pem" \
      "${domain}_privkey.pem" \
      > "/etc/ssl/private/${domain}.pem"

  rm "${domain}_fullchain.pem" \
     "${domain}_privkey.pem"

}

main() {
  echo "${DOMAINS}" | tr ';' '\n' | while read -r domain
  do
    gen_self_signed_cert "$domain"
  done
}


main