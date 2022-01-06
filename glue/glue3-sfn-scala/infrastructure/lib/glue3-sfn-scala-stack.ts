import * as cdk from '@aws-cdk/core';
import * as glue from '@aws-cdk/aws-glue';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export class Glue3SfnScalaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const glueJob = new glue.Job(this, "Glue3 Example Job", {
      jobName: cdk.Stack.of(this).stackName,
      executable: glue.JobExecutable.scalaEtl({
        glueVersion: glue.GlueVersion.V3_0,
        script: glue.Code.fromAsset("../src/main/scala/com/github/wojtekwalczak/glue3_sfn_scala/SparkApp.scala"),
        className: 'com.github.wojtekwalczak.glue3_sfn_scala.SparkApp',
        extraJars: [
          glue.Code.fromAsset("../target/glue3-sfn-scala-0.1.0-SNAPSHOT.jar"),
        ],
        extraJarsFirst: true,
      }),
      enableProfilingMetrics: true,
      notifyDelayAfter: cdk.Duration.minutes(3),
      sparkUI: {
        enabled: true
      },
      workerType: glue.WorkerType.STANDARD,
      workerCount: 1,
      maxRetries: 1,
      maxConcurrentRuns: 1,
    });


    const glueTask = new tasks.GlueStartJobRun(this, `${id}-task`, {
      glueJobName: glueJob.jobName,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    const smName = `${id}-sm`;
    new sfn.StateMachine(this, smName, {
      stateMachineName: smName,
      definition: glueTask,
      stateMachineType: sfn.StateMachineType.STANDARD
    });

  }
}
