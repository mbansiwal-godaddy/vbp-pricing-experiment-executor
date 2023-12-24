const config = require('config');
const hivemindUrl = config.get('hivemind.url');

const HivemindRequest = require('../models/HivemindRequest');
const HttpClient = require('./HttpClient');
let httpClient = new HttpClient();

const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const logger = new Logger('HivemindService');

class HivemindService {
    constructor() {
        return (async () => {
            httpClient = await new HttpClient();
            return this;
        })();
    }

    async bucketize(experiment, record){
        const experimentResult = {isValid : false, record: record};
        try {
            const data = await httpClient.post(hivemindUrl, new HivemindRequest(experiment, record));
            const cohorts = data.cohorts;
            for (const experimentId in cohorts) {
                const experimentData = cohorts[experimentId];
                if(experimentData.cohortId && experimentData.cohortId != 'ineligible'){
                    const cohortInfo = {};
                    cohortInfo.experimentId = experimentId;
                    cohortInfo.cohortId = experimentData.cohortId;
                    cohortInfo.metaData = experimentData.data;
                    experimentResult.cohortInfo = cohortInfo;
                    experimentResult.isValid = true;
                    break;
                }
            }
            return experimentResult;
        } catch (err){
            experimentResult.isFailed = true;
            return experimentResult;
        }
    }

    async bucketizeRecords(experiment, expiryRecords){
        const logEvent = new LogEvent({experiment: experiment, expiryRecords: expiryRecords.length});
        logger.info(logEvent);
        const bucketedRecords = [];
        const failedRecords = [];
        const experimentResultPromises = [];
        for (let i = 0; i < expiryRecords.length; i++)
        {
            const expiryRecord = expiryRecords[i];
            experimentResultPromises.push(this.bucketize(experiment, expiryRecord));
        }
        const experimentResults = await Promise.all(experimentResultPromises);

        for (let i = 0; i < experimentResults.length; i++) {
            if(experimentResults[i].isValid){
                let resultRow = {};
                Object.assign(resultRow, experimentResults[i].record);
                Object.assign(resultRow, experimentResults[i].cohortInfo);
                bucketedRecords.push(resultRow);
            } else if(experimentResults[i].isFailed){
                failedRecords.push(experimentResults[i].record);
            }
        }
        logEvent.bucketingResult = {processedRecords : experimentResults.length, totalFailure: failedRecords.length, bucketedRecords: bucketedRecords.length};
        logger.info(logEvent);
        return {bucketedRecords: bucketedRecords, failedRecords: failedRecords};
    }
}

module.exports = HivemindService;
