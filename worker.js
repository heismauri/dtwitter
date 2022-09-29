const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['3.0.8'];
const landingPage = '';// index.html

// return Response with its corresponding Content-Type
const addHeaders = (body) => {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
};

// Check params
const paramsBuilder = (form) => {
  const cleanParams = {};
  // Check if installed version is the lastest one
  const installedVersion = form.get('version') && form.get('version');
  if (!installedVersion || !supportedVersions.includes(installedVersion)) {
    cleanParams.message = `Download the latest update on https://routinehub.co/shortcut/${shortcutId}/`;
    return cleanParams;
  }
  cleanParams.version = installedVersion;
  // Check for valid URL
  const tweetURL = form.get('url') && form.get('url').split('?')[0];
  if (!tweetURL || !tweetURL.includes('twitter.com')) {
    cleanParams.message = `URL not supported by ${shortcutName}`;
    return cleanParams;
  }
  // Check for valid tweet ID
  const tweetID = tweetURL.split('?')[0].split('/')[5];
  if (!tweetID || !/\d{8,}/.test(tweetID)) {
    cleanParams.message = 'The Tweet URL contains invalid parameters';
    return cleanParams;
  }
  cleanParams.id = tweetID;
  const selector = form.get('selector') && JSON.parse(form.get('selector')).selector;
  if (selector) {
    cleanParams.selector = selector;
  }
  return cleanParams;
};

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

// Call the Twitter API 1.1
const handleRequest = async (request) => {
  if (request.method === 'POST') {
    let dtwitterResponse;
    const params = paramsBuilder(await request.formData());
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
    // Check if the API gave them for any errors
    if (twitterAPI.errors !== undefined) {
      dtwitterResponse = {
        error: twitterAPI.errors[0].message.replace('.', '')
      };
      // Check if the tweet has media on it
    } else if (twitterAPI.extended_entities === undefined) {
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
