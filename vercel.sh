#!/bin/bash

# this script allows us to run a different command for pull requests

if [[ $VERCEL_GIT_COMMIT_REF == "main"  ]] ; then
  echo "This is our main branch"
  yarn build:production
  yarn test:ci
else
  echo "This is not our main branch"
  yarn build
  yarn test:ci
fi