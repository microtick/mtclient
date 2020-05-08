#!/bin/sh

IP=45.79.207.112

export MICROTICK_PROD=false
export MICROTICK_WEBSOCKET=$IP:8081
export MICROTICK_FAUCET=$IP:8888
export MICROTICK_LEADERBOARD=$IP:8889

echo prod=$MICROTICK_PROD
echo websocket=$MICROTICK_WEBSOCKET
echo faucet=$MICROTICK_FAUCET
echo leader=$MICROTICK_LEADERBOARD

npm run build
