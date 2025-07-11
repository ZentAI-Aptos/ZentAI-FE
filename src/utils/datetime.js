import Moment from "moment";
Moment.locale("en");

const current = async () => Moment().utcOffset("+07:00");

const format = (rawDate, format) =>
  Moment(rawDate).utcOffset("+07:00").format(format);

const move = async (rawDate, value) => rawDate.add(value, "day");

const fromNow = (date) => Moment.utc(date).local().fromNow();

const compare = (date_1, date_2) => date_1 > date_2;

export { current, format, move, fromNow, compare };
