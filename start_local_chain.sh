#!/bin/bash

source ./load_dotenv.sh .env_dev

ganache --fork $ALCHEMY_KEY -u 0xcA436e14855323927d6e6264470DeD36455fC8bD