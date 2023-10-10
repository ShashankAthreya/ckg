# Boilerplate reverse proxy

Configuration files for a boilerplate reverse proxy that runs:
- HAProxy to act as reverse proxy
- Certbot to renew LetsEncrypt certificates


## Setup

1. Clone this repository
2. [Configure the backend servers](#backend-configuration) (you must at least configure the default backend)
3. [Configure the SSL certificates](#ssl-certificates-configuration) (provide at least one domain name)
4. Start the service with `docker compose up -d`. This runs the following steps:
   - generate temporary self-signed SSL certificates,
   - start HAProxy,
   - get SSL certificates from LetsEncrypt,
   - load them into HAProxy,
   - sets certbot to run every 12h to renew the LetsEncrypt certificates.
   - (If certificates are found in the `gateway_config_data-certificates` volumes, the generation of self-signed certificates is skipped.)


## Configuration

To manually reload the configuration without restarting HAProxy:

```bash
docker kill --signal=USR2 gateway_config-haproxy-1
```

### Backend configuration

Backend servers are configured in [`conf-haproxy/haproxy.cfg`](conf-haproxy/haproxy.cfg).

- To add a backend, add a `backend` block at the end of the file (see [examples](#backend-examples) below)
- The default backend is set by `default_backend` in block `frontend https-in`. It is used as fallback for all traffic that does not match a specific hostname.
- The backend for a specific hostname can be set in block `frontend https-in`:

```
acl my_rule hdr(Host) -i my_hostname.net
use_backend my_backend if my_rule
```

#### Backend examples

Forward traffic to port `80` of Docker container `my_container` (must be on the same Docker network, e.g. by adding it to the same docker-compose file):

```
backend my-local-docker-backend 
  server my_hostname my_container:80 resolvers docker
```

Forward traffic to port `443` of external host at `10.0.0.1`, with SSL encryption. In this case, the SSL certificate used by the backend must be placed in the directory `./data-backend-certs/my-external-https-backend`:

```
backend my-external-https-backend
  server my_hostname 10.0.0.1:443 ssl ca-file /etc/ssl/backend-certs/my-external-https-backend/
```

Load-balancing between multiple hosts:

``` 
backend my-load-balanced-backend
	balance roundrobin
	server host1 10.0.0.1:443 check fall 3 rise 2 ssl ca-file /etc/ssl/backend-certs/my-load-balanced-backend/
	server host2 10.0.0.2:443 check fall 3 rise 2 ssl ca-file /etc/ssl/backend-certs/my-load-balanced-backend/
	server host3 10.0.0.3:443 check fall 3 rise 2 ssl ca-file /etc/ssl/backend-certs/my-load-balanced-backend/
```

Insecure things you shouldn’t do:

- Set up an external backend with `ssl verify none`. With this option, HAProxy does not verify the SSL certificate of the backend. It may be useful for testing, but should not be used in production.
- Set up an external backend without SSL. In this case, unencrypted traffic runs between the proxy and the backend.


### SSL certificates configuration

We use LetsEncrypt certificates that are renewed by Certbot. Domains are set by `DOMAINS` in [`certbot.env`](certbot.env). It contains semicolon-separated groups of comma-separated domains. Certbot will get a certificate for each group of domains (e.g. `DOMAINS=example.net;test.net,test.org` will result in two certificates: one for `example.net` and one covering both `test.net` and `test.org`).


## Volumes

The following volumes contain certificates and should be backed up:

- `gateway_config_data-letsencrypt` contains LetsEncrypt certificates and renewal information (mounted to`/etc/letsencrypt`)
- `gateway_config_data-certificates` contains HAProxy certificates, derived from LetsEncrypt (mounted to`/etc/ssl/private`)

Backup:

```bash
docker run --rm \
  --volume gateway_config_data-letsencrypt:/gateway_config_volumes/data_letsencrypt/ \
  --volume gateway_config_data-certificates:/gateway_config_volumes/data_certificates/ \
  --volume $(pwd):/backup/ \
  ubuntu \
  tar cvaf /backup/gateway_config_volumes.tar.gz /gateway_config_volumes/
```

Restore:

```bash
docker run --rm \
  --volume gateway_config_data-letsencrypt:/gateway_config_volumes/data_letsencrypt/ \
  --volume gateway_config_data-certificates:/gateway_config_volumes/data_certificates/ \
  --volume $(pwd):/backup/ \
  ubuntu \
  tar xvf /backup/gateway_config_volumes.tar.gz -C /gateway_config_volumes/ --strip 1
```
