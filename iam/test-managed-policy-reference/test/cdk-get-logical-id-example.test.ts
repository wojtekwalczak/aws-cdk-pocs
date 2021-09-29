import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkGetLogicalIdExample from '../lib/cdk-get-logical-id-example-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkGetLogicalIdExample.CdkGetLogicalIdExampleStack(app, 'MyTestStack');
  // THEN

  const roleId = stack.getLogicalId(stack.role.node.findChild('Resource') as cdk.CfnElement);
  const managedPolicyResource = stack.managedPolicy as cdk.Resource;
  const managedPolicyId = stack.getLogicalId(managedPolicyResource.node.findChild('Resource') as cdk.CfnElement);

  expectCDK(stack).to(haveResource("AWS::IAM::ManagedPolicy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": "dynamodb:*",
          "Effect": "Allow",
          "Resource": "*"
        }
      ],
      "Version": "2012-10-17"
    },
    "Description": "",
    "ManagedPolicyName": "managed-policy",
    "Path": "/"
  }));

  expectCDK(stack).to(haveResource("AWS::IAM::Policy", {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": "s3:*",
          "Effect": "Allow",
          "Resource": "*"
        }
      ],
      "Version": "2012-10-17"
    },
    "PolicyName": "policy",
    "Roles": [
      {
        "Ref": roleId
      }
    ]
  }));

  expectCDK(stack).to(haveResource("AWS::IAM::Role", {
    "AssumeRolePolicyDocument": {
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "AWS": {
              "Fn::Join": [
                "",
                [
                  "arn:",
                  {
                    "Ref": "AWS::Partition"
                  },
                  ":iam::",
                  {
                    "Ref": "AWS::AccountId"
                  },
                  ":root"
                ]
              ]
            }
          }
        }
      ],
      "Version": "2012-10-17"
    },
    "ManagedPolicyArns": [
      {
        "Ref": managedPolicyId
      }
    ],
    "RoleName": "my-role"
  }));
});
