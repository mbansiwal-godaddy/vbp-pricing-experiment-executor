const moment = require("moment-timezone");
const path = require("path");
const DATE_FORMAT = "YYYY-MM-DD";
const POSSIBLE_DATE_FORMATS = [
    DATE_FORMAT, "M/DD/YYYY", "MM/D/YYYY", "M/D/YYYY"
];

const DB_TIMEZONE = "US/Arizona";

exports.formatToDate = (value) => {
    return moment(value.trim(), POSSIBLE_DATE_FORMATS, true);
};

exports.formatDateToStandard = (value) => {
    return this.formatToDate(value).format(DATE_FORMAT);
};

exports.getMoment = () => {
    return moment().tz(DB_TIMEZONE);
}

exports.getCurrentDate = () => {
    return this.getMoment().tz(DB_TIMEZONE).format(DATE_FORMAT);
};

exports.getFutureDate = (days) => {
    return this.getMoment().tz(DB_TIMEZONE).add(days, "days").format(DATE_FORMAT);
};

exports.getCurrentTimeInMiliseconds = () => {
    return this.getMoment().tz(DB_TIMEZONE).valueOf();
};
