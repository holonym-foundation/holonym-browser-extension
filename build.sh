#! /usr/bin/bash

rm -rf ./dist/* 
cp ./manifest.json ./dist/manifest.json
cp ./src/frontend/styles/*.css ./dist
cp ./src/frontend/popups/default/popup.html ./dist/default_popup.html
cp ./src/frontend/popups/confirmation/popup.html ./dist/confirmation_popup.html

cp ./src/frontend/img/*Holo-Logo-new* ./dist # copy icons

# Bundle
rollup --config rollup.config.js

browserify ./rollup-temp/confirmation_popup.js > ./dist/confirmation_popup.js

# zip for production
printf "\nzipping ./dist\n"
zip -r ./prod-materials/dist.zip ./dist
