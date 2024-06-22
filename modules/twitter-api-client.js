import { getGuestToken, twitterAPIGuestClient } from './get-token';
import jsonBuilder from './json-builder';

const paramsFeatures = {
  'c9s_tweet_anatomy_moderator_badge_enabled': true,
  'creator_subscriptions_tweet_preview_api_enabled': true,
  'freedom_of_speech_not_reach_fetch_enabled': true,
  'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
  'longform_notetweets_consumption_enabled': true,
  'longform_notetweets_inline_media_enabled': true,
  'longform_notetweets_rich_text_read_enabled': true,
  'responsive_web_edit_tweet_api_enabled': true,
  'responsive_web_enhance_cards_enabled': false,
  'responsive_web_graphql_exclude_directive_enabled': true,
  'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
  'responsive_web_graphql_timeline_navigation_enabled': true,
  'responsive_web_home_pinned_timelines_enabled': true,
  'responsive_web_media_download_video_enabled': false,
  'responsive_web_twitter_article_tweet_consumption_enabled': false,
  'standardized_nudges_misinfo': true,
  'tweet_awards_web_tipping_enabled': false,
  'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
  'tweetypie_unmention_optimization_enabled': true,
  'verified_phone_label_enabled': false,
  'view_counts_everywhere_api_enabled': true
};

const generateTwitterHeaders = async (env) => {
  const guestToken = await getGuestToken(env);
  return {
    'Accept': 'application/json',
    'Accept-Language': 'en',
    'Authorization': `Bearer ${env.TOKEN}`,
    'Content-Type': 'application/json',
    'Origin': 'https://x.com',
    'Referer': 'https://x.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 '
      + 'Safari/537.36',
    'x-guest-token': String(guestToken),
    'x-twitter-active-user': 'yes',
    'x-twitter-client-language': 'en',
    'Cookie': `guest_id=${encodeURIComponent(`v1:${String(guestToken)}`)}`
  };
};

const paramsVariables = (id) => {
  return {
    'includePromotedContent': false,
    'tweetId': String(id),
    'withCommunity': false,
    'withVoice': false
  };
};

const validateTweetResponse = (twitterParsedResponse) => {
  const { tweetResult } = twitterParsedResponse.data;
  const tweetResultResult = tweetResult?.result;
  const tweetTypename = tweetResultResult?.__typename;
  if (!Object.keys(tweetResult).length || !tweetResultResult) throw new Error('NotFound');
  if (tweetTypename === 'TweetUnavailable') {
    switch (tweetResultResult.reason) {
      case 'Suspended':
      case 'Protected':
      case 'NsfwLoggedOut':
        throw new Error(tweetResultResult.reason);
      default:
        throw new Error('TweetUnavailable');
    }
  }
  return { tweetResultResult, tweetTypename };
};

const extractMediaFromTweet = (tweetResultResult, tweetTypename) => {
  let baseTweet = tweetResultResult.legacy;
  let repostedTweet = baseTweet?.retweeted_status_result?.result?.legacy;
  let quotedTweet = tweetResultResult?.quoted_status_result?.result?.legacy;

  if (tweetTypename === 'TweetWithVisibilityResults') {
    baseTweet = tweetResultResult?.tweet.legacy;
    repostedTweet = baseTweet?.retweeted_status_result?.result?.tweet?.legacy;
    quotedTweet = tweetResultResult?.tweet?.quoted_status_result?.result?.tweet?.legacy;
  }

  return (repostedTweet?.extended_entities?.media
          || baseTweet?.extended_entities?.media
          || quotedTweet?.extended_entities?.media);
};

const twitterAPIClient = async (params, env, firstTry = true) => {
  try {
    const twitterHeaders = await generateTwitterHeaders(env);
    const twitterEndpoint = new URL('https://api.x.com/graphql/5GOHgZe-8U2j5sVHQzEm9A/TweetResultByRestId');
    twitterEndpoint.search = new URLSearchParams({
      'features': JSON.stringify(paramsFeatures),
      'variables': JSON.stringify(paramsVariables(params.id))
    });
    const twitterResponse = await fetch(twitterEndpoint, {
      headers: twitterHeaders
    })
      .then((response) => response.text());
    if (!twitterResponse) throw new Error('Blank');
    if (twitterResponse.includes('Rate limit exceeded')) {
      if (firstTry) {
        await twitterAPIGuestClient(env);
        return await twitterAPIClient(params, env, false);
      }

      throw new Error('RateLimit');
    }
    const twitterParsedResponse = JSON.parse(twitterResponse);
    if (twitterParsedResponse?.errors?.[0]?.message === 'Bad guest token') {
      if (firstTry) {
        await twitterAPIGuestClient(env);
        return await twitterAPIClient(params, env, false);
      }

      throw new Error('BadGuestToken');
    }

    const { tweetResultResult, tweetTypename } = validateTweetResponse(twitterParsedResponse);
    const tweetMedia = extractMediaFromTweet(tweetResultResult, tweetTypename);
    if (!tweetMedia) throw new Error('NoMedia');

    return jsonBuilder(tweetMedia, params.selector);
  } catch (error) {
    return { error };
  }
};

export default twitterAPIClient;
