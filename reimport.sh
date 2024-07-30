#!/bin/bash
set -e
export NODE_OPTIONS=--max-old-space-size=4096
#npm run extract
#npm run expand
NODE_ENV=production npm run reconcile
