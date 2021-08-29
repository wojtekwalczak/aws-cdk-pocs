#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { EmrStepFunctionsSparkPiStack } from "../lib/emr-step-functions-spark-pi-stack";

const app = new cdk.App();
new EmrStepFunctionsSparkPiStack(app, "EmrStepFunctionsSparkPiStack", {
  logsBucketName: `${process.env.USERNAME}-emr-poc-logs`,
  masterInstanceType: "m5.xlarge",
  coreInstanceType: "m5.xlarge",
  stateMachineName: `${process.env.USERNAME}-emr-poc`,
});
