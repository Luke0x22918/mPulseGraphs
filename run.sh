#!/bin/sh

export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export FLASK_APP=soasta_proxy

# bind on all interfaces (not just localhost)
python3 -m flask run --host=0.0.0.0
