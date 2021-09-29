import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';

export class CdkGetLogicalIdExampleStack extends cdk.Stack {
  managedPolicy: cdk.Resource | iam.IManagedPolicy;
  role: iam.IRole;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.managedPolicy = new iam.ManagedPolicy(this, 'managed-policy', {
      managedPolicyName: 'managed-policy',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["dynamodb:*"],
            resources: ["*"],
            effect: iam.Effect.ALLOW
          })
        ]
      })
    });

    const policy = new iam.Policy(this, 'policy', {
      policyName: 'policy',
      statements: [
        new iam.PolicyStatement({
          actions: ["s3:*"],
          resources: ['*'],
          effect: iam.Effect.ALLOW
        })
      ]
    });

    this.role = new iam.Role(this, 'my-role', {
      roleName: 'my-role',
      assumedBy: new iam.AccountPrincipal(this.account),
    });

    // Alternatively: this.role.attachInlinePolicy(policy);
    policy.attachToRole(this.role);
    this.role.addManagedPolicy(this.managedPolicy as iam.IManagedPolicy);
  }
}
