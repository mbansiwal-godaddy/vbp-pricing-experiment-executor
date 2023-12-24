const PART_SIZE =  10 * 1024 * 1024;
const QUEUE_SIZE = 5;

const aws = require('aws-sdk');
const s3 = new aws.S3();
const streamApi = require('stream');

const Parser = require('@json2csv/plainjs').Parser;
const json2CsvParser = new Parser();
const json2CsvParserWithoutHeaders = new Parser({header:false});

const Logger = require("../log/Logger");
const LogEvent = require("../log/LogEvent");

const logger = new Logger('HivemindService');
class S3StreamingService {
    #bucket;
    #fileName;
    #stream;
    #uploadToS3;
    #includeHeader;
    constructor(bucket, fileName) {
        this.#bucket = bucket;
        this.#fileName = fileName;
        this.#stream = new streamApi.PassThrough();
        this.#uploadToS3 = this.#startUpload(bucket, fileName);
        this.#includeHeader = true;
    }

    #startUpload(bucket, fileName)  {
        const logEvent = new LogEvent({bucket: bucket, fileName:fileName, method: "startUpload"});
        logger.info(logEvent);
        const params = {
            Bucket: bucket,
            Key: fileName,
            Body: this.#stream
        };
        const options = {
            partSize: PART_SIZE,
            queueSize: QUEUE_SIZE
        };
        return s3.upload(params, options).promise();
    }

    add(data)  {
        this.#stream.write(this.#includeHeader ? json2CsvParser.parse(data) : "\n"+json2CsvParserWithoutHeaders.parse(data));
        this.#includeHeader = false;
    }

    async finishUpload()  {
        const logEvent = new LogEvent({bucket: this.#bucket, fileName:this.#fileName, method: "finishUpload"});
        this.#stream.end();
        return await this.#uploadToS3;
    }
}

module.exports = S3StreamingService;
