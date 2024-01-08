const config = require('config');
const ExperimentExecutionStatus = require("../common/ExperimentExecutionStatus");
const commonUtil = require("../common/CommonUtil");
const ExperimentRepository = require("../repository/ExperimentRepository");
const experimentRepository = new ExperimentRepository();
const globalQuery = config.get('global.query');

class ExperimentConfigService {
  constructor() {
  }

  async getExperiments() {
    const experimentConfigs = config.get('experiments');
    const experiments = [];
    const currentDate = commonUtil.getMoment();
    for (let i = 0; i < experimentConfigs.length; i++) {
      const experimentConfig = experimentConfigs[i];
      let experiment = await experimentRepository.getExperiment(experimentConfig.id);
      if(!experiment){
        experiment = {};
        Object.assign(experiment, experimentConfig);
        experiment.status = ExperimentExecutionStatus.NEW_EXPERIMENT;
      }

      const allocationDate = experimentConfig.allocationDate?commonUtil.formatToDate(experimentConfig.allocationDate):currentDate;
      if(currentDate >= allocationDate && experiment.status != ExperimentExecutionStatus.EXPERIMENT_BUCKETING_FINISHED){
        experiment.query = this.#getAthenaQueryWithParamsConfigured(experimentConfig);
        experiments.push(experiment);
      }
    }
    return experiments;
  }

  #getAthenaQueryWithParamsConfigured(experimentConfig){
    const query = {};
    let queryName = globalQuery.name;
    let queryParams = [];
    queryParams.push(`'${experimentConfig.startDate}'`);
    queryParams.push(`'${experimentConfig.endDate}'`);
    queryParams.push(`'${experimentConfig.productLine}'`);
    queryParams.push(`'${experimentConfig.productSubLine}'`);

    if(experimentConfig.query){
      queryName = experimentConfig.query.name;
      if(experimentConfig.query.params){
        queryParams = experimentConfig.query.params;
      }
    }
    query.name = queryName;
    query.params = queryParams;
    return query;
  }
}

module.exports = ExperimentConfigService;
