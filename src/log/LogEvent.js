class LogEvent {
    // constructor() {
    //     this.#start();
    // }

    constructor(messages) {
        this.#start();
        if(messages){
            Object.assign(this, messages);
        }
    }

    #start = () => {
        this.startTime = new Date().getTime();
    }

    #calculateDuration() {
        this.duration = (new Date().getTime() - this.startTime);
    }

    getMessage() {
        this.#calculateDuration();
        return JSON.stringify(this);
    }

    addErrorMessage(ex) {
        this.error = ex.message;
        this.status = 500;
    }
}

module.exports = LogEvent;
