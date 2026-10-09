import dayjs from "dayjs";
import "dayjs/locale/am";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export { dayjs };
