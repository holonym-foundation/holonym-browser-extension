#! /usr/bin/bash

rm -rf ./dist/* 
cp ./manifest.json ./dist/manifest.json
cp ./src/default_popup/default_popup.html ./dist/default_popup.html
cp ./src/content/*.css ./dist
cp ./src/confirmation.html ./dist/confirmation.html

rollup --config rollup.config.js
