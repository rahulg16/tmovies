import { createQueryClient } from "./createQueryClient";

// Backwards-compatible singleton for any code that still imports the default.
const queryClient = createQueryClient();

export { createQueryClient };
export default queryClient;
