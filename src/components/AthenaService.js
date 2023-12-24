const QUERY_FORMAT = "EXECUTE QUERY_NAME USING 'START_DATE', 'END_DATE'";

const config = require('config');

const aws = require('aws-sdk');
const athena = new aws.Athena();

const DataLakeSearchStatus = require("../common/DataLakeSearchStatus");
const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const logger = new Logger('AthenaService');

class AthenaService {
  constructor() {
  }

  async executeQuery(dataGatherRequest) {
    const queryString = QUERY_FORMAT.replace("START_DATE", dataGatherRequest.startDate).replace("END_DATE", dataGatherRequest.endDate).replace("QUERY_NAME", dataGatherRequest.queryName);
    const logEvent = new LogEvent({queryString: queryString, method:"executeQuery"});
    const params = {
      QueryString: queryString,
      ResultConfiguration: {
        OutputLocation: 's3://'+ config.get("athena.athenaSearchResultS3Bucket") +'/', // Provide your S3 output bucket
      },
      QueryExecutionContext: {
        Database: 'default' // Replace with your Athena database name
      },
      /* Parameters that will be used in the query */
      WorkGroup: config.get("athena.workgroup"), // Specify the Athena workgroup
      // ExecutionParameters: queryParams
    };

    try {
      const queryExecution = await athena.startQueryExecution(params).promise();
      return await this.#getStatus(queryExecution.QueryExecutionId);
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      throw ex;
    }
  }

  async createQuery(createQueryRequest) {
    const logEvent = new LogEvent({createQueryRequest: createQueryRequest, method:"createQuery"});
    const params = {
      QueryStatement: createQueryRequest.query,
      StatementName: createQueryRequest.name,
      WorkGroup: config.get("athena.workgroup")
    };

    try {
      await athena.createPreparedStatement(params).promise();
      const result = {message: `successfully created query ${createQueryRequest.name}`};
      logEvent.result = result;
      logger.info(logEvent);
      return result;
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      return {errorMessage: `failure while creating query ${createQueryRequest.name} due to ${ex.message}`, statusCode: 500}
    }
  }

  async getQuery(queryName) {
    const logEvent = new LogEvent({queryName: queryName, method:"getQuery"});
    const params = {
      StatementName: queryName,
      WorkGroup: config.get("athena.workgroup")
    };

    try {
      const query = await athena.getPreparedStatement(params).promise();
      const result = query.PreparedStatement;
      logEvent.result = result;
      logger.info(logEvent);
      return result;
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      return {errorMessage: `failure while fetching query ${queryName} due to ${ex.message}`, statusCode: 500}
    }
  }

  async listQueries() {
    const logEvent = new LogEvent({method:"listQueries"});
    const params = {
      WorkGroup: config.get("athena.workgroup")
    };

    try {
      let result = [];
      do{
        const queryResult = await athena.listPreparedStatements(params).promise();
        result = result.concat(queryResult.PreparedStatements);
        params.NextToken = queryResult.NextToken;
      } while(params.NextToken != null);

      return result;
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      return {errorMessage: `failure while getting list of queries due to ${ex.message}`, statusCode: 500}
    }
  }

  async #getStatus(executionId) {
    const logEvent = new LogEvent({executionId: executionId, method:"getStatus"});
    try {
        const executionStatus = await athena.getQueryExecution({QueryExecutionId: executionId}).promise();
        const status = executionStatus.QueryExecution.Status.State;
        console.log(`Query Status: ${status}`);
        return {executionId: executionId, status: status };
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      throw ex;
    }
  }

  async waitForJobCompletion(executionId) {
    const logEvent = new LogEvent({executionId: executionId, method:"waitForJobCompletion"});
    try {
      let executionStatus;
      do {
        await new Promise(resolve => setTimeout(resolve, 2000));
        executionStatus = await this.#getStatus(executionId);
      } while (executionStatus.status == DataLakeSearchStatus.RUNNING);
      return executionStatus;
    } catch (ex) {
      logEvent.addErrorMessage(ex);
      logger.error(logEvent);
      throw ex;
    }
  }
}

module.exports = AthenaService;
