# Glue3 + Step Functions + Scala

## Introduction

This example build a simple, single-task state machine, which runs Spark job on Glue 3.0.

## Deployment

To deploy this stack in your account run the `deploy.sh` script:

    $ ./deploy.sh

This script will:

    1. Build a jar file (without this file the deployment will fail).
    2. Download CDK's dependencies.
    3. Deploy the stack to AWS.
