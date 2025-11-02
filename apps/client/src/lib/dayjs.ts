import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// dayjs plugins
dayjs.extend(calendar);
dayjs.extend(utc);
dayjs.extend(timezone);

