import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as EmrStepFunctionsSparkPi from "../lib/emr-step-functions-spark-pi-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new EmrStepFunctionsSparkPi.EmrStepFunctionsSparkPiStack(
    app,
    "MyTestStack",
    {
      logsBucketName: "emr-poc-logs",
      masterInstanceType: "m5.xlarge",
      coreInstanceType: "m5.xlarge",
      stateMachineName: "emr-poc",
    }
  );
  // THEN
  // expectCDK(stack).to(
  //   matchTemplate(
  //     {
  //       Resources: {},
  //     },
  //     MatchStyle.EXACT
  //   )
  // );
});
