'use strict';
process.env.NODE_CONFIG_DIR='tests/unit/config';

const chai = require('chai');
const uuid = require('uuid');
const sinon = require('sinon');
const expect = chai.expect;
const config = require('config');
const experiments = config.get('experiments');

const ExperimentExecutionStatus = require('../../../src/common/ExperimentExecutionStatus');
const DataLakeSearchStatus = require('../../../src/common/DataLakeSearchStatus');

const S3StreamingService = require("../../../src/components/S3StreamingService");
const HivemindService = require("../../../src/components/HivemindService");
const AthenaIterator = require('../../../src/components/AthenaIterator');

const ExperimentRepository = require('../../../src/repository/ExperimentRepository');

const inProgressExperimentId = "inporgress1";
const failedExperimentId = "failedExperiment1";
const finishedExperimentId = "finishedExperiment1";

describe('Tests execute method', function () {
    let experimentRepositorySaveExperimentStub;
    let experimentRepositoryGetExperimentStub;
    let athenaIteratorNextStub;
    let athenaIteratorHasNextStub;
    let s3StreamingServiceSStub;
    let s3StreamingServiceFinishUploadStub;
    let hivemindServiceInitializeStub;
    let hivemindServiceBucketizeStub;

    before(function (done) {
        const dataGatheringFinishedStatus = {executionId: uuid.v4(), status: DataLakeSearchStatus.FINISHED };
        const inProgressExperiment = {...experiments[2], status: ExperimentExecutionStatus.DATA_SEARCH_IN_PROGRESS, dataGatheringStatus: DataLakeSearchStatus.RUNNING};
        const failedExperiment = {...experiments[1], status: ExperimentExecutionStatus.DATA_SEARCH_FAILED, dataGatheringStatus: DataLakeSearchStatus.FAILED};
        const finishedExperiment = {...experiments[0], status: ExperimentExecutionStatus.DATA_SEARCH_FINISHED, dataGatheringStatus: dataGatheringFinishedStatus.status, dataGatheringExecutionId: dataGatheringFinishedStatus.executionId};

        experimentRepositoryGetExperimentStub = sinon.stub(ExperimentRepository.prototype, 'getExperiment').callsFake((experimentId) => {
                if(experimentId == inProgressExperimentId){
                    return Promise.resolve(inProgressExperiment);
                } else if(experimentId == failedExperimentId){
                    return Promise.resolve(failedExperiment);
                }else if(experimentId == finishedExperimentId) {
                    return Promise.resolve(finishedExperiment);
                }
                return {};
        });

        experimentRepositorySaveExperimentStub = sinon.stub(ExperimentRepository.prototype, 'saveExperiment').callsFake((experiment) => {
            validateSaveExperiment(finishedExperiment, dataGatheringFinishedStatus, experiment, ExperimentExecutionStatus.EXPERIMENT_BUCKETING_FINISHED);
            return Promise.resolve({});
        });

        sinon.createStubInstance(AthenaIterator);
        sinon.createStubInstance(S3StreamingService);
        sinon.createStubInstance(HivemindService);

        hivemindServiceInitializeStub = sinon.stub(HivemindService.prototype, 'initialize').callsFake(() => {
            return Promise.resolve({});
        });

        s3StreamingServiceSStub = sinon.stub(S3StreamingService.prototype, 'constructor').callsFake(() => {
            return Promise.resolve({});
        });

        s3StreamingServiceFinishUploadStub = sinon.stub(S3StreamingService.prototype, 'finishUpload').callsFake(() => {
            return Promise.resolve({});
        });

        hivemindServiceBucketizeStub = sinon.stub(HivemindService.prototype, 'bucketizeRecords').callsFake(() => {
            let records = {bucketedRecords:[{id:123, cohort:"cohort1"}], failedRecords:[]};
            return Promise.resolve(records);
        });

        athenaIteratorNextStub = sinon.stub(AthenaIterator.prototype, 'next').callsFake(() => {
            let records = [{id:123}];
            return Promise.resolve(records);
        });

        athenaIteratorHasNextStub = sinon.stub(AthenaIterator.prototype, 'hasNext');
        athenaIteratorHasNextStub.onFirstCall().returns(Promise.resolve(true));
        athenaIteratorHasNextStub.onSecondCall().returns(Promise.resolve(false));

        done();
    });

    after(function (done) {
        experimentRepositorySaveExperimentStub.restore();
        experimentRepositoryGetExperimentStub.restore();
        athenaIteratorHasNextStub.restore();
        athenaIteratorNextStub.restore();
        s3StreamingServiceSStub.restore();
        hivemindServiceInitializeStub.restore();
        hivemindServiceBucketizeStub.restore();
        s3StreamingServiceFinishUploadStub.restore();
        done();
    });


    it('test data gathering job for all status types', async () => {
        const ExperimentBucketingJob = require('../../../src/jobs/ExperimentBucketingJob');
        const experimentBucketingJob = new ExperimentBucketingJob();
        await experimentBucketingJob.execute();
    });
});

function validateSaveExperiment(experimentConfig, dataGatheringStatus, inputExperiment, expectedExperimentStatus) {
    let expectedExperiment = {...experimentConfig};
    expectedExperiment.dataGatheringExecutionId = dataGatheringStatus.executionId;
    expectedExperiment.dataGatheringStatus = dataGatheringStatus.status;
    expectedExperiment.status = expectedExperimentStatus;
    expect(expectedExperiment).to.deep.eq(inputExperiment);
}
