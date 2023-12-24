const config = require('config');
const Logger = require('../log/Logger');
const logger = new Logger('AthenaIterator');
const LogEvent = require('../log/LogEvent');
const AWS = require('aws-sdk');
const AthenaExpress = require('athena-express');
const athenaExpress = new AthenaExpress({
    aws: AWS,
    s3: 's3://'+ config.get("athena.athenaSearchResultS3Bucket") +'/',
});

class AthenaIterator {
    constructor(queryExecutionId) {
        this.queryExecutionId = queryExecutionId;
        this.first = true;
    }

    async next(){
        const logEvent = new LogEvent();
        this.first = false;

        const dataFetchQuery = {
            pagination: 999,
            NextToken: this.nextToken,
            QueryExecutionId: this.queryExecutionId,
        };

        try{
            const queryResults = await athenaExpress.query(dataFetchQuery);
            this.nextToken = queryResults.NextToken;
            return queryResults.Items;
        } catch (ex) {
            logEvent.addErrorMessage(ex);
            logger.error(logEvent);
            throw ex;
        }
    }

    hasNext(){
        return this.first || this.nextToken != null;
    }
}

module.exports = AthenaIterator;
