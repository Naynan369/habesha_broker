import { withSessionApi } from "@config/cookie/cookie";
import { apiHandler } from "@libs/server/api";

export default withSessionApi(apiHandler);

