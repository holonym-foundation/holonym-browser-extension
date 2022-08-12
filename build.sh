#! /usr/bin/bash

rm -rf ./dist/* 
cp ./manifest.json ./dist/manifest.json
cp ./src/content/*.css ./dist
cp ./src/index.html ./dist/index.html

rollup --config rollup.config.js
