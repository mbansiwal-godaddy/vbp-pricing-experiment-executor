'use strict';
const EXPERIMENT_RESULT_BUCKET = "vbp-pricing-experiment-bucket";
const S3StreamingService = require('../../src/components/S3StreamingService');

const chai = require('chai');
const expect = chai.expect;
const streamApi = require('stream');

describe('Price Lock Intake Test', function () {
    this.timeout(900000);
    it('Tests Product lock message', async () => {
        process.env.AWS_REGION = "us-west-2";

        let message = {"PrivateLabelId":"1","PriceGroupId":"0","PriceGroupName":"Default","PfId":"4605","PriceType":"Standard Price","TransactionCurrencyType":"USD","NewOriginalListPrice":"599","NewTransactionCurrencyLockPrice":"599","Author":"mbansiwal","Purpose":"Testing in Dev","PriceLockPeriodStartDate":"08/15/2021","PriceLockPeriodEndDate":"08/15/2021","LockDate":"04/19/2023","UnLockDate":"04/19/2023","BillingType":"Auto","Term":"     Annual","FileName":"product-lock-files/0aff496a-7711-429f-bceb-822fcb7c4c5c:billingAddOn.csv","EventType":"product-lock-files"};

        let event = {
            "Records": [
                {
                    "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
                    "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
                    "body": JSON.stringify(message),
                    "attributes": {
                        "ApproximateReceiveCount": "1",
                        "SentTimestamp": "1545082649183",
                        "SenderId": "AIDAIENQZJOLO23YVJ4VO",
                        "ApproximateFirstReceiveTimestamp": "1545082649185"
                    },
                    "messageAttributes": {},
                    "md5OfBody": "098f6bcd4621d373cade4e832627b4f6",
                    "eventSource": "aws:sqs",
                    "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
                    "awsRegion": "us-east-2"
                }
            ]
        };
        // let PassThroughStream = streamApi.PassThrough;
        const s3StreamingService = new S3StreamingService(EXPERIMENT_RESULT_BUCKET, "testfolder/testfile2.csv");
        s3StreamingService.add("Hello");
        s3StreamingService.add(JSON.stringify(event));
        const result = await s3StreamingService.finishUpload();

        console.log(result);
    });

});
