#!/bin/bash
set -e

# Export PROD_ variables without the PROD_ prefix
while IFS='=' read -r key value; do
  if [[ $key == PROD_* ]]; then
    # Remove PROD_ prefix and quotes
    clean_key="${key#PROD_}"
    clean_value="${value//\"/}"
    export "$clean_key=$clean_value"
  fi
done < .env

# Deploy
npm run deploy
