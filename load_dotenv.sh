#!/bin/bash

# Local .env
if [ -f $1 ]; then
    # Load Environment Variables
    export $(cat $1 | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}' )
fi