const SERVICE_NAME = 'vbp-experiment-executor';

class Logger {
  constructor(className) {
    this.className = className;
  };

  info = (logEvent) => {
    logEvent.name = this.className;
    logEvent.serviceName = SERVICE_NAME;
    console.info(logEvent.getMessage());
  };

  error = (logEvent) => {
    logEvent.name = this.className;
    logEvent.serviceName = SERVICE_NAME;
    console.error(logEvent.getMessage());
  };
}

module.exports = Logger;
