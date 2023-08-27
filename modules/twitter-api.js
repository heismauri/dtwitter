import { getGuestToken, twitterAPIGuestClient } from './get-token';

const paramsFeatures = {
  'creator_subscriptions_tweet_preview_api_enabled': true,
  'tweetypie_unmention_optimization_enabled': true,
  'responsive_web_edit_tweet_api_enabled': true,
  'graphql_is_translatable_rweb_tweet_is_translatable_enabled': true,
  'view_counts_everywhere_api_enabled': true,
  'longform_notetweets_consumption_enabled': true,
  'responsive_web_twitter_article_tweet_consumption_enabled': false,
  'tweet_awards_web_tipping_enabled': false,
  'freedom_of_speech_not_reach_fetch_enabled': true,
  'standardized_nudges_misinfo': true,
  'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled': true,
  'longform_notetweets_rich_text_read_enabled': true,
  'longform_notetweets_inline_media_enabled': true,
  'responsive_web_graphql_exclude_directive_enabled': true,
  'verified_phone_label_enabled': false,
  'responsive_web_media_download_video_enabled': false,
  'responsive_web_graphql_skip_user_profile_image_extensions_enabled': false,
  'responsive_web_graphql_timeline_navigation_enabled': true,
  'responsive_web_enhance_cards_enabled': false
};

const paramsFieldToggles = {
  'withArticleRichContentState': false
};

const twitterHeaders = async (env) => {
  const guestToken = await getGuestToken(env);
  return {
    'Origin': 'https://twitter.com',
    'Referer': 'https://twitter.com/',
    'x-twitter-active-user': 'yes',
    'x-guest-token': String(guestToken),
    'Authorization': `Bearer ${env.TOKEN}`
  };
};

const paramsVariables = (id) => {
  return {
    'tweetId': String(id),
    'withCommunity': false,
    'includePromotedContent': false,
    'withVoice': false
  };
};

const twitterAPIClient = async (id, env, firstTry = true) => {
  try {
    const twitterGraphqlHeaders = await twitterHeaders(env);
    const twitterGraphql = new URL('https://api.twitter.com/graphql/3HC_X_wzxnMmUBRIn3MWpQ/TweetResultByRestId');
    twitterGraphql.search = new URLSearchParams({
      'variables': JSON.stringify(paramsVariables(id)),
      'features': JSON.stringify(paramsFeatures),
      'fieldToggles': JSON.stringify(paramsFieldToggles)
    });
    const twitterGraphqlResponse = await fetch(twitterGraphql, {
      headers: twitterGraphqlHeaders
    })
      .then((response) => response.json());
    if (firstTry && twitterGraphqlResponse?.errors?.[0]?.message === 'Bad guest token') {
      await twitterAPIGuestClient(env);
      return await twitterAPIClient(id, env, false);
    }
    const { tweetResult } = twitterGraphqlResponse.data;
    if (Object.keys(tweetResult).length === 0 || !tweetResult.result) {
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
