const ExperimentExecutionStatus = require('../common/ExperimentExecutionStatus');

const config = require('config');

const ExperimentRepository = require('../repository/ExperimentRepository');
const AthenaIterator = require('../components/AthenaIterator');
const S3StreamingService = require("../components/S3StreamingService");
const HivemindService = require("../components/HivemindService");
const ExperimentConfigService = require('../components/ExperimentConfigService');
const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const experimentConfigService = new ExperimentConfigService();
const experimentRepository = new ExperimentRepository();
const logger = new Logger('ExperimentBucketingJob');

let running = false;
let hivemindService;
class ExperimentBucketingJob {
  constructor() {
  }

  async execute() {
    if(running)
    {
      logger.info(new LogEvent({event: "Job is already running"}));
      return;
    }
    running = true;
    const logEvent = new LogEvent({event: "Started"});
    try{
      hivemindService = await new HivemindService();

      logger.info(logEvent);
      const bucketingProcesses = [];
      const experiments = await experimentConfigService.getExperiments();
      for (let i = 0; i < experiments.length; i++) {
        const experiment = experiments[i];
        if(experiment.status == ExperimentExecutionStatus.DATA_SEARCH_FINISHED){
          bucketingProcesses.push(this.#fetchRecordsAndExecuteExperiment(experiment));
        }
      }
      await Promise.all(bucketingProcesses);
      logEvent.event = `Finished processing ${bucketingProcesses.length} experiments`;
      logger.info(logEvent);
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
    } finally {
      running = false;
    }
  }

  async #fetchRecordsAndExecuteExperiment(experiment){
    const logEvent = new LogEvent({method: "fetchRecordsAndExecuteExperiment", experiment: experiment});
    const fileName = experiment.id + ".csv";
    const s3StreamingService = await new S3StreamingService(config.get("athena.experimentResultOutputBucket"), fileName);
    const recordsIterator = new AthenaIterator(experiment.dataGatheringExecutionId);
    let failedRecords = [];
    while(recordsIterator.hasNext()){
      let inputRecords = await recordsIterator.next();
      inputRecords = inputRecords.concat(failedRecords);
      failedRecords = await this.#bucketizeRecords(s3StreamingService, experiment, inputRecords);
    }
    if(failedRecords.length > 0 ){
      failedRecords = await this.#bucketizeRecords(s3StreamingService, experiment, failedRecords);
    }
    console.log(`No of records failed after all retries::${failedRecords.length}`);
    logEvent.recordsFailed = failedRecords.length;
    logger.info(logEvent);
    await s3StreamingService.finishUpload();
    experiment.status = ExperimentExecutionStatus.EXPERIMENT_BUCKETING_FINISHED;
    await experimentRepository.saveExperiment(experiment);
    logger.info(logEvent);
  }

  async #bucketizeRecords(s3StreamingService, experiment,  inputRecords){
    const experimentResults = await hivemindService.bucketizeRecords(experiment, inputRecords);
    const bucketedRecords = experimentResults.bucketedRecords;
    if(bucketedRecords.length > 0){
      s3StreamingService.add(bucketedRecords);
    }
    return experimentResults.failedRecords;
  }
}

module.exports = ExperimentBucketingJob;
