import type { JsonBuilderResult } from "@api/types/MediaResult";

export type TwitterApiResult = JsonBuilderResult | { status: "error"; error: Error };
