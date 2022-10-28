#! /usr/bin/bash

USAGE="
Usage: $(basename "$0") <no_zip>

If NO_ZIP has a value, then dist will not be zipped.
"
no_zip=$1

rm -rf ./dist/* 
cp ./manifest.json ./dist/manifest.json
cp -r ./src/frontend/styles/* ./dist
cp ./src/frontend/popups/default/popup.html ./dist/default_popup.html
cp ./src/frontend/popups/confirmation-credentials/popup.html ./dist/credentials_confirmation_popup.html
cp ./src/frontend/popups/confirmation-share-creds/popup.html ./dist/share_creds_confirmation_popup.html
cp ./src/frontend/popups/set-password/popup.html ./dist/set_password_popup.html

cp ./src/frontend/img/* ./dist # copy icons

# Bundle
rollup --config rollup.config.js

# zip for production
if [[ -z $no_zip ]]; then
    printf "\nzipping ./dist\n"
    zip -r ./prod-materials/dist.zip ./dist
fi
