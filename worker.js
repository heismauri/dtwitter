const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['3.0.8'];
const landingPage = ''; // index.html

// Build the response
const jsonBuilder = (json, isSelectorEnabled) => {
  const dtwitterJSON = {
    media: json.extended_entities.media.map((media) => {
      let mediaTweet;
      const mediaType = media.type;
      // Video & GIFs
      if (mediaType === 'animated_gif' || mediaType === 'video') {
        const video = media.video_info.variants.filter((variant) => variant.bitrate !== undefined);
        video.sort((a, b) => a.bitrate - b.bitrate);
        // Quality selector
        if (isSelectorEnabled && mediaType === 'video') {
          const videoQuality = {
            low: video[0].url,
          };
            // Append other qualities if available
          if (video[1] && video[1].url) videoQuality.medium = video[1].url;
          if (video[2] && video[2].url) videoQuality.high = video[2].url;
          mediaTweet = {
            type: 'selector',
            link: videoQuality
          };
          // High resolution video
        } else {
          mediaTweet = {
            type: mediaType,
            link: video[video.length - 1].url
          };
          // Only return sizes for GIFs
          if (mediaType === 'animated_gif') {
            mediaTweet.width = media.sizes.large.w;
            mediaTweet.height = media.sizes.large.h;
          }
        }
      }
      // Photos
      if (mediaType === 'photo') {
        const extension = media.media_url_https.match(/\.[a-z]+$/gi).shift();
        const photoLink = media.media_url_https.replace(extension, '');
        const photoExtension = extension.replace('.', '');
        const finalPhotoLink = `${photoLink}?format=${photoExtension}&name=orig`;
        mediaTweet = {
          type: mediaType,
          link: finalPhotoLink
        };
      }
      return mediaTweet;
    })
      .filter((item) => !!item)
  };
  return dtwitterJSON;
};

// return Response with its corresponding Content-Type
const addHeaders = (body) => {
  return new Response(JSON.stringify(body), {
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
  const tweetID = object.url.match(/\d{8,}/);
  if (!tweetID) {
    object.message = 'The Tweet URL contains invalid parameters';
    return object;
  }
  // Save the id on params object
  object.id = tweetID.shift();
  // Rewrite selector key to save the boolean from the dictionary
  if (object.selector) {
    object.selector = JSON.parse(object.selector).selector;
  }
  return object;
};

// Call the Twitter API 1.1
const handleRequest = async (request) => {
  if (request.method === 'POST') {
    let dtwitterResponse;
    const objectForm = Object.fromEntries(await request.formData());
    const params = paramsBuilder(objectForm);
    if (params.message) {
      dtwitterResponse = {
        error: params.message
      };
      return addHeaders(dtwitterResponse);
    }
    const twitterAPI = await fetch(`https://api.twitter.com/1.1/statuses/show.json?tweet_mode=extended&id=${params.id}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`
      },
    })
      .then((response) => response.json());
    // Check if the API gave any errors
    if (twitterAPI.errors) {
      dtwitterResponse = {
        error: twitterAPI.errors[0].message.replace('.', '')
      };
      // Check if the tweet has media on it
    } else if (!twitterAPI.extended_entities) {
      dtwitterResponse = {
        error: 'Media not found for inputted URL'
      };
    } else {
      // Success
      dtwitterResponse = jsonBuilder(twitterAPI, params.selector);
    }
    return addHeaders(dtwitterResponse);
  }
  return new Response(landingPage, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    },
  });
};

// Workers event listener
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
