const config = require('config');
const ExperimentExecutionStatus = require("../common/ExperimentExecutionStatus");
const ExperimentRepository = require("../repository/ExperimentRepository");
const experimentRepository = new ExperimentRepository();

class ExperimentConfigService {
  constructor() {
  }

  async getExperiments() {
    const experimentConfigs = config.get('experiments');
    const experiments = [];
    for (let i = 0; i < experimentConfigs.length; i++) {
      const experimentConfig = experimentConfigs[i];
      let experiment = await experimentRepository.getExperiment(experimentConfig.id);
      if(!experiment){
        experiment = {};
        Object.assign(experiment, experimentConfig);
        experiment.status = ExperimentExecutionStatus.NEW_EXPERIMENT;
      }
      experiments.push(experiment);
    }
    return experiments;
  }
}

module.exports = ExperimentConfigService;
