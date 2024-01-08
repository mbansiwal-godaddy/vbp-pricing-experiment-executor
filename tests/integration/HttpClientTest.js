'use strict';
process.env.AWS_REGION = "us-west-2";
process.env.NODE_ENV = "dev";

const HttpClient = require('../../src/components/HttpClient');
const config = require('config');

const chai = require('chai');
const expect = chai.expect;
const streamApi = require('stream');

describe('Price Lock Intake Test', function () {
    this.timeout(900000);
    it('Tests Product lock message', async () => {
        // module.exports = {
        //     NODE_ENV : process.env.NODE_ENV || 'test',
        // }
        let hivemindUrl = config.get("hivemind.url");
        let httpClient = await new HttpClient();

        let request = {
            "callingService": "myApp",
            "subject": {
                "shopperId": "idString8",
                "customerId": "f0a6e68d-366f-4d43-9712-a86dc01ed2bc"
            },
            "visitGuid": "f0a6e68d-366f-4d43-9712-a86dc01ed2bc",
            "attributes": { "market": "en-US", "product_line": "`DotComDomains  `", "renewal_type": "auto", "sub_line":"EE" },
            "experiments": [
                "abn_vbp_poc_test_exp_2"
            ]
        };

        let response = await httpClient.post(hivemindUrl, request)

        console.log(response);
    });

});
