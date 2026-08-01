import type { JsonBuilderResult } from "@/types/MediaResult";

export type TwitterApiResult = JsonBuilderResult | { status: "error"; error: Error };
