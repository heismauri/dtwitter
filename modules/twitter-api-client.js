import { getGuestToken, twitterAPIGuestClient } from './get-token';

const paramsFeatures = {
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
  'responsive_web_media_download_video_enabled': false,
  'responsive_web_twitter_article_tweet_consumption_enabled': false,
  'standardized_nudges_misinfo': true,
  'tweet_awards_web_tipping_enabled': false,
  'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
  'tweetypie_unmention_optimization_enabled': true,
  'verified_phone_label_enabled': false,
  'view_counts_everywhere_api_enabled': true
};

const paramsFieldToggles = {
  'withArticleRichContentState': false
};

const generateTwitterHeaders = async (env) => {
  const guestToken = await getGuestToken(env);
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${env.TOKEN}`,
    'Origin': 'https://twitter.com',
    'Referer': 'https://twitter.com/',
    'x-guest-token': String(guestToken),
    'x-twitter-active-user': 'yes'
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

const twitterAPIClient = async (id, env, firstTry = true) => {
  try {
    const twitterHeaders = await generateTwitterHeaders(env);
    const twitterEndpoint = new URL('https://api.twitter.com/graphql/3HC_X_wzxnMmUBRIn3MWpQ/TweetResultByRestId');
    twitterEndpoint.search = new URLSearchParams({
      'features': JSON.stringify(paramsFeatures),
      'fieldToggles': JSON.stringify(paramsFieldToggles),
      'variables': JSON.stringify(paramsVariables(id))
    });
    const twitterResponse = await fetch(twitterEndpoint, {
      headers: twitterHeaders
    })
      .then((response) => response.text());
    if (firstTry && twitterResponse.includes('Rate limit exceeded')) {
      await twitterAPIGuestClient(env);
      return await twitterAPIClient(id, env, false);
    }
    const twitterParsedResponse = JSON.parse(twitterResponse);
    if (firstTry && twitterParsedResponse?.errors?.[0]?.message === 'Bad guest token') {
      await twitterAPIGuestClient(env);
      return await twitterAPIClient(id, env, false);
    }
    const { tweetResult } = twitterParsedResponse.data;
    if (!Object.keys(tweetResult).length || !tweetResult.result) {
      throw new Error('notfound');
    }
    if (tweetResult.result.reason === 'NsfwLoggedOut') {
      throw new Error('nsfw');
    }
    if (!tweetResult.result.legacy) {
      throw new Error('notfound');
    }
    const tweetContent = tweetResult.result.legacy;
    if (!tweetContent.extended_entities?.media) {
      throw new Error('empty');
    }
    return tweetContent.extended_entities.media;
  } catch (error) {
    return { error };
  }
};

export default twitterAPIClient;
