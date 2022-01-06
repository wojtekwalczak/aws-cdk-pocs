#!/bin/sh

set -ex

mvn clean package -DskipTests

cd infrastructure

npm i

npm run build

npx cdk deploy Glue3SfnScalaStack
