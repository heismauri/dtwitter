const TOKEN = '';
const shortcutId = '6166';
const htmlResponse = ``; // index.html

// Call the Twitter API 1.1
const handleRequest = async (request) => {
  const dtwitterForm = await request.formData();
  const tweetId = dtwitterForm.get('url').split('/')[5];
  const installedVersion = dtwitterForm.get('version');
  const dtwitterApi = `https://api.twitter.com/1.1/statuses/show.json?tweet_mode=extended&id=${tweetId}`;
  const dtwitterJson = await fetch(dtwitterApi, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })
    .then((response) => response.json());
  // Function to create a new json based on Twitter's response
  const dtwitter = (json) => {
    let dtwitterResponse;
    // Check if installed version is the lastest one
    const rhVersion = ['3.0.3'];
    if (!(rhVersion.includes(installedVersion))) {
      dtwitterResponse = {
        error: `Download the latest update on https://routinehub.co/shortcut/${shortcutId}/`,
      };
    // Check if the API gave them for any errors
    } else if ('errors' in json) {
      dtwitterResponse = {
        error: json.errors[0].message.replace('.', ''),
      };
    // Check if the tweet has media on it
    } else if (!('extended_entities' in json)) {
      dtwitterResponse = {
        error: 'Media not found for inputted URL',
      };
    // Success
    } else {
      dtwitterResponse = {
        media: json.extended_entities.media
          .map((media) => {
            let mediaTweet;
            const mediaType = media.type;
            const selectorEnable = JSON.parse(dtwitterForm.get('selector')).selector;
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
    }
    return dtwitterResponse;
  };
  // Stringify the JSON response from the dtwitter function
  return new Response(JSON.stringify(dtwitter(dtwitterJson)), {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });
};

// Workers event listener
addEventListener('fetch', (event) => {
  let response;
  const { request } = event;
  if (request.method === 'POST') {
    response = event.respondWith(handleRequest(event.request));
  } else {
    response = event.respondWith(new Response(htmlResponse, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    }));
  }
  return response;
});
