const shortcutId = '6166';
const shortcutName = 'DTwitter';
const htmlResponse = ``; // index.html

// Build the response
const jsonBuilder = (twitterJSON, selectorEnable) => {
  const dtwitterJSON = {
    media: twitterJSON.extended_entities.media.map((media) => {
      let mediaTweet;
      const mediaType = media.type;
      // Video & GIFs
      if (mediaType === 'animated_gif' || mediaType === 'video') {
        const video = media.video_info.variants.filter((variant) => {
          return variant.bitrate !== undefined;
        });
        video.sort((a, b) => a.bitrate - b.bitrate);
        // Quality selector
        if (selectorEnable && mediaType === 'video') {
          const videoQuality = {
            low: video[0].url,
          };
            // Append other qualities if available
          if (video[1] && video[1].url) videoQuality.medium = video[1].url;
          if (video[2] && video[2].url) videoQuality.high = video[2].url;
          mediaTweet = {
            type: 'selector',
            link: videoQuality,
          };
          // High resolution video
        } else {
          mediaTweet = {
            type: mediaType,
            link: video[video.length - 1].url,
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
          link: finalPhotoLink,
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

// Call the Twitter API 1.1
const handleRequest = async (request) => {
  let dtwitterResponse;
  const dtwitterForm = await request.formData();
  // Check if installed version is the lastest one
  const installedVersion = dtwitterForm.get('version');
  const routinehubVersion = ['3.0.6', '3.0.7'];
  if (!(routinehubVersion.includes(installedVersion))) {
    dtwitterResponse = {
      error: `Download the latest update on https://routinehub.co/shortcut/${shortcutId}/`
    };
    return addHeaders(dtwitterResponse);
  }
  const tweetURL = dtwitterForm.get('url');
  if (!tweetURL.includes('twitter.com')) {
    dtwitterResponse = {
      error: `URL not supported by ${shortcutName}`
    };
    return addHeaders(dtwitterResponse);
  }
  const tweetId = tweetURL.split('?')[0].split('/')[5];
  const twitterAPI = await fetch(`https://api.twitter.com/1.1/statuses/show.json?tweet_mode=extended&id=${tweetId}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })
    .then((response) => response.json());
  // Check if the API gave them for any errors
  if (twitterAPI.errors !== undefined) {
    dtwitterResponse = {
      error: twitterAPI.errors[0].message.replace('.', ''),
    };
  // Check if the tweet has media on it
  } else if (twitterAPI.extended_entities === undefined) {
    dtwitterResponse = {
      error: 'Media not found for inputted URL',
    };
  // Success
  } else {
    const selector = dtwitterForm.get('selector') && JSON.parse(dtwitterForm.get('selector')).selector;
    dtwitterResponse = jsonBuilder(twitterAPI, selector);
  }
  return addHeaders(dtwitterResponse);
};

// Workers event listener
addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST') {
    event.respondWith(
      handleRequest(event.request).catch(
        (error) => new Response(error.stack, { status: 500 })
      )
    );
  } else {
    event.respondWith(
      new Response(htmlResponse, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8'
        },
      })
    );
  }
});
