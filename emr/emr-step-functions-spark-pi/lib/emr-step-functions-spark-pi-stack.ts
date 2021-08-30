import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as s3 from "@aws-cdk/aws-s3";

export interface EmrStepFunctionsSparkPiProps {
  logsBucketName: string;
  masterInstanceType: string;
  coreInstanceType: string;
  stateMachineName: string;
  emrVersion: string;
}

export class EmrStepFunctionsSparkPiStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    infrastructureProps: EmrStepFunctionsSparkPiProps,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const logBucket = new s3.Bucket(this, "LogBucket", {
      bucketName: infrastructureProps.logsBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const clusterRole = new iam.Role(this, "ClusterRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonElasticMapReduceforEC2Role"
        ),
      ],
    });

    logBucket.grantReadWrite(clusterRole);

    const serviceRole = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.ServicePrincipal("elasticmapreduce.amazonaws.com"),
      inlinePolicies: {
        fullEc2Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ec2:*"],
              resources: ["*"],
            }),
          ],
        }),
        passRole: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["iam:PassRole"],
              resources: [clusterRole.roleArn],
            }),
          ],
        }),
      },
    });

    // See: https://github.com/aws/aws-cdk/issues/8080
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      `EMR EC2 Instance Profile`,
      {
        roles: [clusterRole.roleName],
        instanceProfileName: clusterRole.roleName,
      }
    );

    const createCluster = new tasks.EmrCreateCluster(this, "Create Cluster", {
      clusterRole: clusterRole,
      name: sfn.TaskInput.fromJsonPathAt("$.ClusterName").value,
      releaseLabel: infrastructureProps.emrVersion,
      logUri: `s3://${logBucket.bucketName}/`,
      instances: {
        instanceFleets: [
          {
            instanceFleetType: tasks.EmrCreateCluster.InstanceRoleType.MASTER,
            targetOnDemandCapacity: 1,
            instanceTypeConfigs: [
              {
                instanceType: infrastructureProps.masterInstanceType,
              },
            ],
          },
          // Clusters with task instance fleets must also define core instance fleets
          {
            instanceFleetType: tasks.EmrCreateCluster.InstanceRoleType.CORE,
            targetOnDemandCapacity: 1,
            instanceTypeConfigs: [
              {
                instanceType: infrastructureProps.coreInstanceType,
              },
            ],
          },
        ],
      },
      // custom value should be between 10 and 100 GBi
      ebsRootVolumeSize: cdk.Size.gibibytes(100),
      applications: [
        {
          name: "Hive",
        },
        {
          name: "Spark",
        },
      ],
      resultSelector: {
        "CreateClusterResult.$": "$",
        "ClusterId.$": "$.ClusterId",
      },
      serviceRole,
    });

    const terminationProtection = new tasks.EmrSetClusterTerminationProtection(
      this,
      "Termination Protection",
      {
        clusterId: sfn.TaskInput.fromJsonPathAt("$.ClusterId").value,
        terminationProtected: false,
      }
    );

    const terminateCluster = new tasks.EmrTerminateCluster(
      this,
      "Terminate Cluster",
      {
        clusterId: sfn.TaskInput.fromJsonPathAt(
          "$.CreateClusterResult.ClusterId"
        ).value,
      }
    );

    const sparkPi = new tasks.EmrAddStep(this, "Task", {
      clusterId: sfn.TaskInput.fromJsonPathAt("$.ClusterId").value,
      name: "SparkPi",
      jar: "command-runner.jar",
      args: [
        "spark-submit",
        "--deploy-mode",
        "cluster",
        "--master",
        "yarn",
        "--class",
        "org.apache.spark.examples.SparkPi",
        "/usr/lib/spark/examples/jars/spark-examples.jar",
        "10",
      ],
      actionOnFailure: tasks.ActionOnFailure.CONTINUE,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
      resultPath: "$.SparkPiResult",
    });

    const terminateClusterChoice = new sfn.Choice(this, "Terminate cluster?");
    terminateClusterChoice.when(
      sfn.Condition.booleanEquals("$.TerminateCluster", true),
      terminateCluster
    );
    terminateClusterChoice.otherwise(new sfn.Succeed(this, "End"));

    const taskState = sparkPi.next(terminateClusterChoice);
    const createClusterChoice = new sfn.Choice(this, "Create cluster?");
    createClusterChoice.when(
      sfn.Condition.booleanEquals("$.CreateCluster", true),
      createCluster
    );
    createClusterChoice.afterwards().next(taskState);
    createClusterChoice.otherwise(taskState);

    new sfn.StateMachine(this, "StateMachine", {
      stateMachineName: infrastructureProps.stateMachineName,
      stateMachineType: sfn.StateMachineType.STANDARD,
      definition: createClusterChoice,
    });
  }
}
