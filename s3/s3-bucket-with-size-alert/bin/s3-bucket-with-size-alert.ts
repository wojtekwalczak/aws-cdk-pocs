#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { S3BucketWithSizeAlertStack } from "../lib/s3-bucket-with-size-alert-stack";

const app = new cdk.App();
const SIZE_1_KB = 1 * 1024;

new S3BucketWithSizeAlertStack(app, "s3-bucket-with-size-alert", {
  userArn: "<PROVIDE_USER_ARN>", // this user will have RW rights to the bucket
  maxBucketSizeInBytes: SIZE_1_KB,
  alertRecipients: ["<PROVIDE_YOUR_EMAIL>"], // alerts will be sent to these emails
});
