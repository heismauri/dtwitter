const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['3.2.0'];
const landingPage = ''; // index.html

// Sometimes Twitter's API does not return a valid response
// this prevents the script from breaking
const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return undefined;
  }
};

// return Response with its corresponding Content-Type
const jsonResponseBuilder = (body, options = {}) => {
  return new Response(JSON.stringify(body), {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
};

// Check params
const paramsBuilder = (object) => {
  // Check if installed version is the lastest one
  if (!object.version || !supportedVersions.includes(object.version)) {
    object.message = `Download the latest update on https://routinehub.co/shortcut/${shortcutId}/`;
    return object;
  }
  // Check for valid URL
  if (!object.url || !object.url.includes('twitter.com')) {
    object.message = `URL not supported by ${shortcutName}`;
    return object;
  }
  // Check for valid tweet ID
  const tweetID = object.url.match(/\d{18,}/);
  if (!tweetID) {
    object.message = 'The Tweet URL contains invalid parameters';
    return object;
  }
  // Save the id on params object
  [object.id] = tweetID;
  // Rewrite selector key to save the boolean from the dictionary
  if (object.selector) {
    object.selector = JSON.parse(object.selector).selector;
  }
  return object;
};

// Build the response
const jsonBuilder = (json, isSelectorEnabled) => {
  return {
    media: json.extended_entities.media.map((media) => {
      let mediaTweet;
      const mediaType = media.type;
      // Photos
      if (mediaType === 'photo') {
        const [extension] = media.media_url_https.match(/\.[a-z]+$/gi);
        const photoLink = media.media_url_https.replace(extension, '');
        const photoExtension = extension.replace('.', '');
        const finalPhotoLink = `${photoLink}?format=${photoExtension}&name=orig`;
        mediaTweet = {
          type: mediaType,
          link: finalPhotoLink
        };
        return mediaTweet;
      }
      // Video & GIFs
      const videoVariants = media.video_info.variants
        .filter((variant) => variant.bitrate !== undefined)
        .sort((a, b) => a.bitrate - b.bitrate);
      // Quality selector
      if (isSelectorEnabled && mediaType === 'video') {
        const videoSelector = {
          low: videoVariants[0].url,
        };
        // Append other qualities if available
        if (videoVariants[1] && videoVariants[1].url) videoSelector.medium = videoVariants[1].url;
        if (videoVariants[2] && videoVariants[2].url) videoSelector.high = videoVariants[2].url;
        mediaTweet = {
          type: 'selector',
          link: videoSelector
        };
        return mediaTweet;
      }
      // Return only highest video resultion
      mediaTweet = {
        type: mediaType,
        link: videoVariants[videoVariants.length - 1].url
      };
      // Only return sizes for GIFs
      if (mediaType === 'animated_gif') {
        mediaTweet.width = media.sizes.large.w;
        mediaTweet.height = media.sizes.large.h;
      }
      return mediaTweet;
    })
  };
};

// Call the Twitter API 1.1
const handlePostRequest = async (request, env) => {
  const objectForm = Object.fromEntries(await request.formData());
  const params = paramsBuilder(objectForm);
  if (params.message) {
    return jsonResponseBuilder({ error: params.message }, { status: 400 });
  }
  const twitterEndpoint = new URL('https://api.twitter.com/1.1/statuses/show.json');
  twitterEndpoint.search = new URLSearchParams({
    'tweet_mode': 'extended',
    'id': params.id,
  }).toString();
  const twitterAPI = await fetch(twitterEndpoint, {
    headers: {
      Authorization: `Bearer ${env.TOKEN}`
    },
  })
    .then((response) => response.text());
  const twitterJSON = parseJSON(twitterAPI);
  // Check if the API gave any errors
  if (!twitterJSON) {
    return jsonResponseBuilder(
      { error: "Twitter's API does not seem to be working right now,please try again later" },
      { status: 503 }
    );
  }
  if (twitterJSON.errors && twitterJSON.errors[0].code === 34) {
    return jsonResponseBuilder(
      { error: 'Sorry, the download may have failed due to the presence of explicit material in the tweet' },
      { status: 400 }
    );
  }
  if (twitterJSON.errors) {
    return jsonResponseBuilder(
      { error: (twitterJSON.errors[0].message || twitterJSON.errors[0].detail).replace('.', '') },
      { status: 400 }
    );
  }
  // Check if the tweet has media on it
  if (!(twitterJSON.extended_entities && twitterJSON.extended_entities.media)) {
    return jsonResponseBuilder(
      { error: 'Sorry, the requested media could not be found for the provided URL' },
      { status: 404 }
    );
  }
  // Success
  return jsonResponseBuilder(jsonBuilder(twitterJSON, params.selector), { status: 200 });
};

export default {
  fetch(request, env) {
    if (request.method === 'POST') {
      return handlePostRequest(request, env);
    }
    return new Response(landingPage, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      },
    });
  }
};
