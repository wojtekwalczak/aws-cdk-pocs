import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as S3BucketWithSizeAlert from "../lib/s3-bucket-with-size-alert-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new S3BucketWithSizeAlert.S3BucketWithSizeAlertStack(
    app,
    "s3-bucket-with-size-alarm",
    {
      userArn: "arn:aws:iam::1:user/some-user",
      alertRecipients: ["some@email.com"],
      maxBucketSizeInBytes: 1,
    }
  );

  expectCDK(stack).to(haveResource("AWS::IAM::Policy"));

  expectCDK(stack).to(haveResource("AWS::S3::Bucket"));

  expectCDK(stack).to(haveResource("AWS::CloudWatch::Alarm"));

  expectCDK(stack).to(haveResource("AWS::SNS::Topic"));

  expectCDK(stack).to(haveResource("AWS::SNS::Subscription"));
});
