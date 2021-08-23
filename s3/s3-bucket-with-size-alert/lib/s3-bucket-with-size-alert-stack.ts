import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import * as sns from "@aws-cdk/aws-sns";
import * as s3 from "@aws-cdk/aws-s3";
import * as cw from "@aws-cdk/aws-cloudwatch";
import * as subs from "@aws-cdk/aws-sns-subscriptions";
import * as cw_actions from "@aws-cdk/aws-cloudwatch-actions";
import { RemovalPolicy } from "@aws-cdk/core";
import { ComparisonOperator } from "@aws-cdk/aws-cloudwatch";

export interface Props {
  userArn: string;
  maxBucketSizeInBytes: number;
  alertRecipients: Array<string>;
}

export class S3BucketWithSizeAlertStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: Props,
    stackProps?: cdk.StackProps
  ) {
    super(scope, id, stackProps);

    const user = this.importUser(id, props.userArn);

    const bucket = this.createBucket(id);

    bucket.grantReadWrite(user);

    const alarm = this.createBucketSizeAlarm(id, props, bucket.bucketName);

    const topic = this.createTopic(id, bucket.bucketName);

    props.alertRecipients.map((email) => {
      topic.addSubscription(new subs.EmailSubscription(email));
    });

    alarm.addAlarmAction(new cw_actions.SnsAction(topic));
  }

  importUser(id: string, userArn: string) {
    return iam.User.fromUserArn(this, `${id}-user`, userArn);
  }

  createBucket(id: string) {
    return new s3.Bucket(this, `${id}-bucket`, {
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  createBucketSizeAlarm(id: string, props: Props, bucketName: string) {
    const metric = new cw.Metric({
      namespace: "AWS/S3",
      // This metric is updated once a day by AWS
      metricName: "BucketSizeBytes",
      dimensions: {
        Name: bucketName,
        StorageType: "StandardStorage",
      },
    });

    const alarmName = `${id}-bucket-size-alarm`;
    const alarm = metric.createAlarm(this, alarmName, {
      alarmName: alarmName,
      alarmDescription: "Alarm for too large bucket",
      threshold: props.maxBucketSizeInBytes,
      evaluationPeriods: 1,
      actionsEnabled: true,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      period: cdk.Duration.days(1),
    });

    return alarm;
  }

  createTopic(id: string, bucketName: string) {
    const topic = new sns.Topic(this, `${id}-sns-topic`, {
      topicName: id,
      displayName: `Bucket size topic for ${bucketName}`,
    });
    return topic;
  }
}
