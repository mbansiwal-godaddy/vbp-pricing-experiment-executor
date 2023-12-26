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

const AthenaService = require('../../../src/components/AthenaService');
const ExperimentRepository = require('../../../src/repository/ExperimentRepository');

const inProgressExperimentId = "inporgress1";
const failedExperimentId = "failedExperiment1";
const finishedExperimentId = "finishedExperiment1";

describe('Tests execute method', function () {
    let experimentRepositorySaveExperimentStub;
    let experimentRepositoryGetExperimentStub;
    let athenaServiceExecuteQueryStub;
    let athenaServiceWaitForStatusStub;

    before(function (done) {
        const inProgressExperiment = {...experiments[2], status: ExperimentExecutionStatus.DATA_SEARCH_IN_PROGRESS, dataGatheringStatus: DataLakeSearchStatus.RUNNING};
        const failedExperiment = {...experiments[1], status: ExperimentExecutionStatus.DATA_SEARCH_FAILED, dataGatheringStatus: DataLakeSearchStatus.FAILED};
        const finishedExperiment = {...experiments[0], status: ExperimentExecutionStatus.DATA_SEARCH_FINISHED, dataGatheringStatus: DataLakeSearchStatus.FINISHED};
        const newExperiment = {...experiments[3], status: ExperimentExecutionStatus.DATA_SEARCH_FINISHED, dataGatheringStatus: DataLakeSearchStatus.FINISHED};
        const dataGatheringRunningStatus = {executionId: uuid.v4(), status: DataLakeSearchStatus.RUNNING };
        const dataGatheringFinishedStatus = {executionId: dataGatheringRunningStatus.executionId, status: DataLakeSearchStatus.FINISHED };
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
            if(experiment.id == newExperiment.id && experiment.dataGatheringStatus == DataLakeSearchStatus.RUNNING){
                validateSaveExperiment(newExperiment, dataGatheringRunningStatus, experiment, ExperimentExecutionStatus.DATA_SEARCH_IN_PROGRESS);
            }
            else if(experiment.id == failedExperiment.id && experiment.dataGatheringStatus == DataLakeSearchStatus.RUNNING){
                validateSaveExperiment(failedExperiment, dataGatheringRunningStatus, experiment, ExperimentExecutionStatus.DATA_SEARCH_IN_PROGRESS);
            } else if(experiment.id == failedExperiment.id){
                validateSaveExperiment(failedExperiment, dataGatheringFinishedStatus, experiment, ExperimentExecutionStatus.DATA_SEARCH_FINISHED);
            } else if(experiment.id == newExperiment.id){
                validateSaveExperiment(newExperiment, dataGatheringFinishedStatus, experiment, ExperimentExecutionStatus.DATA_SEARCH_FINISHED);
            }
            else if(experiment.id == inProgressExperiment.id){
                validateSaveExperiment(inProgressExperiment, dataGatheringFinishedStatus, experiment, ExperimentExecutionStatus.DATA_SEARCH_FINISHED);
            } else {
                sinon.assert.fail('Save Experiment called with unexpected experiment id');
            }
            return Promise.resolve({});
        });

        athenaServiceExecuteQueryStub = sinon.stub(AthenaService.prototype, 'executeQuery').callsFake((dataGatheringRequest) => {
            return Promise.resolve(dataGatheringRunningStatus);
        });

        athenaServiceWaitForStatusStub = sinon.stub(AthenaService.prototype, 'waitForJobCompletion').callsFake((dataGatheringRequest) => {
            return Promise.resolve(dataGatheringFinishedStatus);
        });

        done();
    });

    after(function (done) {
        experimentRepositorySaveExperimentStub.restore();
        experimentRepositoryGetExperimentStub.restore();
        athenaServiceExecuteQueryStub.restore();
        athenaServiceWaitForStatusStub.restore();
        done();
    });

    it('test data gathering job for all status types', async () => {
        const DataGatheringJob = require('../../../src/jobs/DataGatheringJob');
        const dataGatheringJob = new DataGatheringJob();
        await dataGatheringJob.execute();
    });
});

function validateSaveExperiment(experimentConfig, dataGatheringStatus, inputExperiment, expectedExperimentStatus) {
    let expectedExperiment = {...experimentConfig};
    expectedExperiment.dataGatheringExecutionId = dataGatheringStatus.executionId;
    expectedExperiment.dataGatheringStatus = dataGatheringStatus.status;
    expectedExperiment.status = expectedExperimentStatus;
    expect(expectedExperiment).to.deep.eq(inputExperiment);
}
