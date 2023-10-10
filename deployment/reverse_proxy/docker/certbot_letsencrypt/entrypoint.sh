#!/bin/sh
set -e

./renew.sh
trap : TERM INT; sleep infinity & wait