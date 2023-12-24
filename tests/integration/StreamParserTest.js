'use strict';
const EXPERIMENT_RESULT_BUCKET = "vbp-pricing-experiment-bucket";
const S3StreamingService = require('../../src/components/S3StreamingService');

const chai = require('chai');
const expect = chai.expect;
const StreamParser = require('@json2csv/plainjs').StreamParser;
const parser = new StreamParser();

describe('Price Lock Intake Test', function () {
    this.timeout(900000);
    it('Tests Product lock message', async () => {
        process.env.AWS_REGION = "us-west-2";
        let messages = [];
        messages.push({"PrivateLabelId":"1","PriceGroupId":"0","PriceGroupName":"Default","PfId":"4605","PriceType":"Standard Price","TransactionCurrencyType":"USD","NewOriginalListPrice":"599","NewTransactionCurrencyLockPrice":"599","Author":"mbansiwal","Purpose":"Testing in Dev","PriceLockPeriodStartDate":"08/15/2021","PriceLockPeriodEndDate":"08/15/2021","LockDate":"04/19/2023","UnLockDate":"04/19/2023","BillingType":"Auto","Term":"     Annual","FileName":"product-lock-files/0aff496a-7711-429f-bceb-822fcb7c4c5c:billingAddOn.csv","EventType":"product-lock-files"});
        messages.push({"PrivateLabelId":"2","PriceGroupId":"0","PriceGroupName":"Default","PfId":"4605","PriceType":"Standard Price","TransactionCurrencyType":"USD","NewOriginalListPrice":"599","NewTransactionCurrencyLockPrice":"599","Author":"mbansiwal","Purpose":"Testing in Dev","PriceLockPeriodStartDate":"08/15/2021","PriceLockPeriodEndDate":"08/15/2021","LockDate":"04/19/2023","UnLockDate":"04/19/2023","BillingType":"Auto","Term":"     Annual","FileName":"product-lock-files/0aff496a-7711-429f-bceb-822fcb7c4c5c:billingAddOn.csv","EventType":"product-lock-files"});

        let messages2 = [];
        messages2.push({"PrivateLabelId":"3","PriceGroupId":"0","PriceGroupName":"Default","PfId":"4605","PriceType":"Standard Price","TransactionCurrencyType":"USD","NewOriginalListPrice":"599","NewTransactionCurrencyLockPrice":"599","Author":"mbansiwal","Purpose":"Testing in Dev","PriceLockPeriodStartDate":"08/15/2021","PriceLockPeriodEndDate":"08/15/2021","LockDate":"04/19/2023","UnLockDate":"04/19/2023","BillingType":"Auto","Term":"     Annual","FileName":"product-lock-files/0aff496a-7711-429f-bceb-822fcb7c4c5c:billingAddOn.csv","EventType":"product-lock-files"});
        messages2.push({"PrivateLabelId":"4","PriceGroupId":"0","PriceGroupName":"Default","PfId":"4605","PriceType":"Standard Price","TransactionCurrencyType":"USD","NewOriginalListPrice":"599","NewTransactionCurrencyLockPrice":"599","Author":"mbansiwal","Purpose":"Testing in Dev","PriceLockPeriodStartDate":"08/15/2021","PriceLockPeriodEndDate":"08/15/2021","LockDate":"04/19/2023","UnLockDate":"04/19/2023","BillingType":"Auto","Term":"     Annual","FileName":"product-lock-files/0aff496a-7711-429f-bceb-822fcb7c4c5c:billingAddOn.csv","EventType":"product-lock-files"});

        // let csv = '';
        // parser.onData = (chunk) => (csv += chunk.toString());
        parser.onEnd = () => console.log("csv");
        parser.onError = (err) => console.error(err);

// You can also listen for events on the conversion and see how the header or the lines are coming out.
        parser.onHeader = (header) => console.log(header);
        parser.onLine = (line) => console.log(line);

        parser.write(JSON.stringify(messages));
        parser.processRow(JSON.stringify(messages2[0]));
        parser.end();
    });

});
