#! /usr/bin/bash

rm -rf ./dist/* 
cp ./manifest.json ./dist/manifest.json
cp ./src/frontend/styles/*.css ./dist
cp ./src/frontend/popups/default/popup.html ./dist/default_popup.html
cp ./src/frontend/popups/confirmation/popup.html ./dist/confirmation_popup.html

rollup --config rollup.config.js
