const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient();

const VbpExperimentTable = "vbp-experiment";

const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const logger = new Logger('ExperimentRepository');

class ExperimentRepository {
  constructor() {
  }

  async getExperiment(id) {
    const params =  {
      TableName: VbpExperimentTable,
      Key: {
          "id": id,
      }
    };
    const logEvent = new LogEvent({params: params, method: "getExperiment"});
    try{
      const experiment = await dynamoClient.get(params).promise();
      logEvent.experiment = experiment;
      logger.info(logEvent);
      return experiment.Item;
    } catch (err) {
      logEvent.addErrorMessage(err);
      logger.error(logEvent);
      throw err;
    }
  }

  async saveExperiment(experiment) {
    const params =  {
      TableName: VbpExperimentTable,
      Item: experiment
    };
    const logEvent = new LogEvent({params: params, method: "saveExperiment"});
    try {
      const result = await dynamoClient.put(params).promise();
      logEvent.saveExperimentResult = result;
      logger.info(logEvent);
      return result;
    } catch (err) {
      logEvent.addErrorMessage(err);
      logger.error(logEvent);
      throw err;
    }
  }
}

module.exports = ExperimentRepository;
