const DataLakeSearchStatus = require('../common/DataLakeSearchStatus');
const ExperimentExecutionStatus = require('../common/ExperimentExecutionStatus');

const config = require('config');

const AthenaService = require('../components/AthenaService');
const ExperimentRepository = require('../repository/ExperimentRepository');
const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const logger = new Logger('DataGatheringJob');
const experimentRepository = new ExperimentRepository();
const athenaService = new AthenaService();

let running = false;
class DataGatheringJob {
  constructor() {
  }

  async execute() {
    if(running)
    {
      logger.info(new LogEvent({event: "Job is already running"}));
    }
    running = true;
    const logEvent = new LogEvent({event: "Started"});
    try{
      logger.info(logEvent);
      const dataSearchStatusProcesses = [];
      const experimentConfigs = config.get('experiments');
      for (let i = 0; i < experimentConfigs.length; i++) {
        const experimentConfig = experimentConfigs[i];
        let experiment = await experimentRepository.getExperiment(experimentConfig.id);
        if(!experiment || experiment.dataGatheringStatus == DataLakeSearchStatus.FAILED){
          experiment = {};
          Object.assign(experiment, experimentConfig);
          await this.#startDataSearch(experiment);
        }
        if(experiment.dataGatheringStatus == DataLakeSearchStatus.RUNNING){
          dataSearchStatusProcesses.push(this.#waitForDataSearchToFinish(experiment));
        }
      }
      await Promise.all(dataSearchStatusProcesses);
      logEvent.event = `Finished processing ${dataSearchStatusProcesses.length} experiments`;
      logger.info(logEvent);
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
    } finally {
      running = false;
    }
  }

  async #startDataSearch(experiment){
    const executionStatus = await athenaService.executeQuery(experiment);
    experiment.dataGatheringExecutionId = executionStatus.executionId;
    experiment.dataGatheringStatus = executionStatus.status;
    experiment.status = ExperimentExecutionStatus.DATA_SEARCH_IN_PROGRESS;
    await experimentRepository.saveExperiment(experiment);
  }

  async #waitForDataSearchToFinish(experiment){
    const executionStatus = await athenaService.waitForJobCompletion(experiment.dataGatheringExecutionId);
    experiment.dataGatheringStatus = executionStatus.status;
    experiment.status = ExperimentExecutionStatus.DATA_SEARCH_FINISHED;
    await experimentRepository.saveExperiment(experiment);
  }
}

module.exports = DataGatheringJob;
