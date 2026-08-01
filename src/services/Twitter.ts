import { jsonBuilder } from "@/json-builder";
import type { TweetMediaItem, TweetResultResult, TwitterGraphQLResponse } from "@/types/TwitterGraphQLResponse";
import type { TwitterApiResult } from "@/types/TwitterApiResult";
import type { ValidatedParams } from "@/types/ValidatedParams";

const paramsFeatures = {
  "c9s_tweet_anatomy_moderator_badge_enabled": true,
  "creator_subscriptions_tweet_preview_api_enabled": true,
  "freedom_of_speech_not_reach_fetch_enabled": true,
  "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
  "longform_notetweets_consumption_enabled": true,
  "longform_notetweets_inline_media_enabled": true,
  "longform_notetweets_rich_text_read_enabled": true,
  "responsive_web_edit_tweet_api_enabled": true,
  "responsive_web_enhance_cards_enabled": false,
  "responsive_web_graphql_exclude_directive_enabled": true,
  "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
  "responsive_web_graphql_timeline_navigation_enabled": true,
  "responsive_web_home_pinned_timelines_enabled": true,
  "responsive_web_media_download_video_enabled": false,
  "responsive_web_twitter_article_tweet_consumption_enabled": false,
  "standardized_nudges_misinfo": true,
  "tweet_awards_web_tipping_enabled": false,
  "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
  "tweetypie_unmention_optimization_enabled": true,
  "verified_phone_label_enabled": false,
  "view_counts_everywhere_api_enabled": true
};

const getGuestToken = async (env: Env): Promise<string> => {
  const tokenMaxAge = 15 * 60 * 1000;
  const tokenKV = await env.data.getWithMetadata<{ timestamp: number }>("token");
  let { value: token } = tokenKV;
  if (!token || Date.now() - (tokenKV.metadata?.timestamp ?? 0) >= tokenMaxAge) {
    const twitterGuestClient = await fetch("https://api.x.com/1.1/guest/activate.json", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.TOKEN}`
      }
    }).then((response) => response.json<{ guest_token: string }>());
    await env.data.put("token", twitterGuestClient.guest_token, {
      metadata: { timestamp: Date.now() }
    });
    token = twitterGuestClient.guest_token;
  }
  return String(token);
};

const generateTwitterHeaders = async (env: Env): Promise<Record<string, string>> => {
  const guestToken = await getGuestToken(env);
  return {
    "Accept": "application/json",
    "Accept-Language": "en",
    "Authorization": `Bearer ${env.TOKEN}`,
    "Content-Type": "application/json",
    "Origin": "https://x.com",
    "Referer": "https://x.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 "
      + "Safari/537.36",
    "x-guest-token": guestToken,
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "Cookie": `guest_id=${encodeURIComponent(`v1:${guestToken}`)}`
  };
};

const paramsVariables = (
  id: string | undefined
): { includePromotedContent: boolean; tweetId: string; withCommunity: boolean; withVoice: boolean } => {
  return {
    "includePromotedContent": false,
    "tweetId": String(id),
    "withCommunity": false,
    "withVoice": false
  };
};

const validateTweetResponse = (
  twitterParsedResponse: TwitterGraphQLResponse
): { tweetResultResult: TweetResultResult; tweetTypename: string | undefined } => {
  const { tweetResult } = twitterParsedResponse.data;
  const tweetResultResult = tweetResult?.result;
  const tweetTypename = tweetResultResult?.__typename;
  if (!Object.keys(tweetResult).length || !tweetResultResult) throw new Error("NotFound");
  if (tweetTypename === "TweetUnavailable") {
    switch (tweetResultResult.reason) {
      case "Suspended":
      case "Protected":
      case "NsfwLoggedOut":
        throw new Error(tweetResultResult.reason);
      default:
        throw new Error("TweetUnavailable");
    }
  }
  return { tweetResultResult, tweetTypename };
};

const extractMediaFromTweet = (
  tweetResultResult: TweetResultResult,
  tweetTypename: string | undefined
): TweetMediaItem[] | undefined => {
  let baseTweet = tweetResultResult.legacy;
  let repostedTweet = baseTweet?.retweeted_status_result?.result?.legacy;
  let quotedTweet = tweetResultResult?.quoted_status_result?.result?.legacy;

  if (tweetTypename === "TweetWithVisibilityResults") {
    baseTweet = tweetResultResult?.tweet!.legacy;
    repostedTweet = baseTweet?.retweeted_status_result?.result?.tweet?.legacy;
    quotedTweet = tweetResultResult?.tweet?.quoted_status_result?.result?.tweet?.legacy;
  }

  return (
    repostedTweet?.extended_entities?.media
    || baseTweet?.extended_entities?.media
    || quotedTweet?.extended_entities?.media
  );
};

const twitterAPIClient = async (params: ValidatedParams, env: Env): Promise<TwitterApiResult> => {
  let responseLog: TwitterGraphQLResponse | undefined;
  let status: number | undefined;
  try {
    const twitterHeaders = await generateTwitterHeaders(env);
    const twitterEndpoint = new URL("https://api.x.com/graphql/5GOHgZe-8U2j5sVHQzEm9A/TweetResultByRestId");
    twitterEndpoint.search = new URLSearchParams({
      "features": JSON.stringify(paramsFeatures),
      "variables": JSON.stringify(paramsVariables(params.id))
    }).toString();
    const twitterResponse = await fetch(twitterEndpoint, {
      headers: twitterHeaders
    });

    if ([403, 429].includes(twitterResponse.status)) throw new Error("Rate Limit");
    if ([404].includes(twitterResponse.status)) throw new Error("Blank");

    const twitterParsedResponse: TwitterGraphQLResponse = JSON.parse(await twitterResponse.text());
    responseLog = twitterParsedResponse;
    status = twitterResponse.status;
    const { tweetResultResult, tweetTypename } = validateTweetResponse(twitterParsedResponse);
    const tweetMedia = extractMediaFromTweet(tweetResultResult, tweetTypename);
    if (!tweetMedia) throw new Error("NoMedia");

    return jsonBuilder(tweetMedia, params.selector);
  } catch (caughtError) {
    const error = caughtError instanceof Error ? caughtError : new Error(String(caughtError));
    const knownErrors = ["Rate Limit", "Blank", "NotFound", "NoMedia", "Suspended", "Protected", "NsfwLoggedOut"];
    if (!knownErrors.includes(error.message)) {
      const dataErrorsKV = await env.data.get("errors");
      const errors = dataErrorsKV ? JSON.parse(dataErrorsKV) : [];
      errors.push({
        id: params.id,
        status,
        error: error.message,
        response: responseLog,
        timestamp: new Date()
      });
      await env.data.put("errors", JSON.stringify(errors));
    }
    return { status: "error", error };
  }
};

export { twitterAPIClient };
