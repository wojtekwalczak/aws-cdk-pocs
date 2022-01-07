#!/bin/sh

set -ex

mvn clean package -DskipTests

cd infrastructure

npm run build

npm test
