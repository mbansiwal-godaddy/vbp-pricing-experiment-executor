'use strict';
process.env.AWS_REGION = "us-west-2";
process.env.NODE_CONFIG_DIR='src/config';
// process.env.NODE_ENV = "dev";


const chai = require('chai');
const expect = chai.expect;
const streamApi = require('stream');


describe('Data gathering job Test', function () {
    this.timeout(900000);
    it('Test Data gathering successfully completes', async () => {

        const DataGatheringJob = require('../../src/jobs/DataGatheringJob');
        const dataGatheringJob = new DataGatheringJob();
        let response = await dataGatheringJob.execute();

        console.log(response);
    });

});
