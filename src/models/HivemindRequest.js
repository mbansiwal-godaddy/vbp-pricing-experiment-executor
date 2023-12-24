const uuid = require("uuid");

class HivemindRequest {
    constructor(experiment, record) {
        this.callingService =  "vbp-pricing-experiment-executor";
        this.subject = {
            shopperId: record.shopper_id,
            customerId: record.customer_id
        };
        this.visitGuid = uuid.v4();
        this.attributes = record;
        if(experiment.label){
            this.labels = [experiment.label]
        } else {
            this.experiments = [experiment.id]
        }
    }
}

module.exports = HivemindRequest;
