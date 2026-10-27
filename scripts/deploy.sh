#!/usr/bin/env sh
set -eu

if ! command -v vercel >/dev/null 2>&1; then
    printf '%s\n' 'Vercel CLI is required. Install it with: npm install --global vercel' >&2
    exit 1
fi

npm test
vercel --prod
