import { shortcutURL, supportedVersions } from "@api/global-variables";
import { twitterAPIClient } from "@api/services/Twitter";
import type { ValidatedParams } from "@api/types/ValidatedParams";

// return Response with its corresponding Content-Type
const jsonResponseBuilder = (body: unknown, options: ResponseInit = {}): Response => {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    ...options
  });
};

// Check params
const objectValidator = (object: ValidatedParams): ValidatedParams => {
  // Check if installed version is a supported one
  if (!object.version || !supportedVersions.includes(object.version)) {
    object.message = `Your current version is outdated. Please download the latest one on ${shortcutURL}.`;
    return object;
  }
  // Check for valid URL
  if (!object.url) {
    object.message = "The URL field is required and cannot be left blank.";
    return object;
  }
  // Check for valid tweet ID
  if (!/^https:\/\/(twitter|x)\.com\/[^/]+\/status\/\d{18,}/.test(object.url)) {
    object.message = `The provided URL (${object.url}) is not valid.`;
    return object;
  }
  // Save the id on params object
  const idMatch = object.url.match(/\d{18,}/);
  if (!idMatch) {
    object.message = `The provided URL (${object.url}) is not valid.`;
    return object;
  }
  [object.id] = idMatch;
  // Rewrite selector key to save the boolean from the dictionary, or accept a string selector like "true"
  try {
    const parsedSelector = JSON.parse(object.selector as string);
    object.selector = Object.hasOwn(parsedSelector, "selector") ? parsedSelector.selector : parsedSelector;
  } catch {
    object.selector = false;
  }
  return object;
};

// Iterate through the form data and return an object
const formToObject = async (request: Request): Promise<ValidatedParams> => {
  try {
    const objectForm = Object.fromEntries(await request.formData()) as unknown as ValidatedParams;
    return objectValidator(objectForm);
  } catch {
    return { message: "There was an error processing the form data." };
  }
};

// Handle POST request
const handlePostRequest = async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
  if (env.MAINTENANCE === "true") {
    return jsonResponseBuilder(
      { error: "DTwitter is under maintenance. Find more at @heismauri on Twitter/X." },
      { status: 503 }
    );
  }
  const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
  if (!success) {
    return jsonResponseBuilder(
      { error: "You are sending too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }
  const params = await formToObject(request);
  if (params.message) {
    return jsonResponseBuilder({ error: params.message }, { status: 400 });
  }
  const twitterJSON = await twitterAPIClient(params, env, ctx);
  // Check if the API gave any errors
  if (twitterJSON.status === "error") {
    switch (twitterJSON.error.message) {
      case "NotFound":
        return jsonResponseBuilder(
          { error: "Sorry, the tweet you were looking for could not be found." },
          { status: 404 }
        );
      case "Protected":
        return jsonResponseBuilder(
          { error: "Sorry, the tweet you are trying to access is private and cannot be viewed or downloaded." },
          { status: 403 }
        );
      case "NsfwLoggedOut":
        return jsonResponseBuilder(
          { error: "Sorry, the download has failed due to the presence of NSFW content in the tweet." },
          { status: 403 }
        );
      case "Suspended":
      case "TweetUnavailable":
        return jsonResponseBuilder(
          { error: "Sorry, the tweet you are trying to access is unavailable." },
          { status: 410 }
        );
      case "NoMedia":
        return jsonResponseBuilder(
          { error: "Sorry, no media could be found for the provided URL." },
          { status: 422 }
        );
      default:
        return jsonResponseBuilder(
          {
            error: "Twitter's API does not seem to be working right now. Please try again later. "
              + "Contact @heismauri on Twitter/X if the problem persists."
          },
          { status: 503 }
        );
    }
  }
  // Success
  return jsonResponseBuilder(twitterJSON);
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    if (request.method === "POST") {
      return handlePostRequest(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
