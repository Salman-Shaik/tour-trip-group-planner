#!/bin/sh
set -eu

npm install
if [ ! -f .env ]; then
  cp .env.example .env
fi
npm run db:seed
npm run dev
