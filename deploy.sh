#!/bin/bash

rm -rf node_modules
rm -rf _site

npm ci
npm run build