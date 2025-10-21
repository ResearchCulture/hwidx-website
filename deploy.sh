#!/bin/bash

rm -rf node_modules
rm -rf _site

if ! command -v yarn &> /dev/null; then
    npm install -g yarn
fi

yarn install
yarn run build