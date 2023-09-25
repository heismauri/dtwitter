const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['4.0.0'];
const landingPage = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="pragma" content="no-cache">
      <title>${shortcutName} - heismauri</title>
      <meta name="description" content="Download videos, photos and GIFs from Twitter, it also works with the Siri Shortcut ${shortcutName} which can be downloaded on RoutineHub">
      <link rel="shortcut icon" href="https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}/icon.png">
      <link rel="stylesheet" rel="preload" as="style" href="https://www.heismauri.com/assets/shortcuts/style.css">
      <script defer src="https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}/downloader.js"></script>
      <script>
        const currentVersion = '${supportedVersions[supportedVersions.length - 1]}'
      </script>
    </head>
    <body>
      <main class="container text-center ${shortcutName.toLowerCase()}">
        <header>
          <h1 class="py-4 m-0">${shortcutName}</h1>
          <img class="d-block mx-auto shortcut-icon" width="200" height="200" alt="${shortcutName}'s shortcut icon" srcset="https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}/icon-x2.png 2x, https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}/icon-x3.png 3x" src="https://www.heismauri.com/assets/shortcuts/${shortcutName.toLowerCase()}/icon.png">
          <p class="py-4 m-0">This API also works with the Siri Shortcut <strong>"${shortcutName}"</strong> which can be downloaded on <a href="https://routinehub.co/shortcut/${shortcutId}/">RoutineHub</a><i class="fa-solid fa-heart visually-hidden"></i></p>
        </header>
        <p class="m-0"><i>The web downloader is still in Beta, make sure to report any errors!</i></p>
        <form id="downloader-form" class="form-group w-100 d-flex my-4" action="#">
          <input class="downloader-url w-100 me-2" type="text" name="url" placeholder="Your ${shortcutName} link goes here!">
          <button id="downloader-submit" class="btn btn-download" type="submit">Download</button>
        </form>
        <div id="downloader-media"></div>
        <a class="btn btn-kofi fw-normal mx-auto my-4" href="https://ko-fi.com/heismauri">Love <strong>${shortcutName}</strong>? <i class="fa-regular fa-heart"></i> Buy me a Ko-fi!</a>
      </main>
      <footer class="copyright text-center my-4 m-0">
        <a class="text-decoration-none" href="https://www.heismauri.com/">www.heismauri.com</a>
      </footer>
    </body>
  </html>
`; // index.html

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
    media: json.includes.media.map((media) => {
      let mediaTweet;
      const mediaType = media.type;
      // Video & GIFs
      if (mediaType === 'animated_gif' || mediaType === 'video') {
        const videoVariants = media.variants
          .filter((variant) => variant.bit_rate !== undefined)
          .sort((a, b) => a.bit_rate - b.bit_rate);
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
          // High resolution videoVariants
        } else {
          mediaTweet = {
            type: mediaType,
            link: videoVariants[videoVariants.length - 1].url
          };
          // Only return sizes for GIFs
          if (mediaType === 'animated_gif') {
            mediaTweet.width = media.width;
            mediaTweet.height = media.height;
          }
        }
      }
      // Photos
      if (mediaType === 'photo') {
        const [extension] = media.url.match(/\.[a-z]+$/gi);
        const photoLink = media.url.replace(extension, '');
        const photoExtension = extension.replace('.', '');
        const finalPhotoLink = `${photoLink}?format=${photoExtension}&name=orig`;
        mediaTweet = {
          type: mediaType,
          link: finalPhotoLink
        };
      }
      return mediaTweet;
    })
  };
};

// Call the Twitter API 2
const handlePostRequest = async (request, env) => {
  const objectForm = Object.fromEntries(await request.formData());
  const params = paramsBuilder(objectForm);
  if (params.message) {
    return jsonResponseBuilder({ error: params.message }, { status: 400 });
  }
  const twitterEndpoint = new URL(`https://api.twitter.com/2/tweets/${params.id}`);
  twitterEndpoint.search = new URLSearchParams({
    'expansions': 'attachments.media_keys',
    'media.fields': ['width', 'height', 'type', 'url', 'variants'],
  }).toString();
  const twitterAPI = await fetch(twitterEndpoint, {
    headers: {
      Authorization: `Bearer ${env.TOKEN}`
    },
  })
    .then((response) => response.text());
  const twitterJSON = parseJSON(twitterAPI);
  // Check if the API gave any errors
  if (!twitterJSON || twitterJSON.detail === 'Too Many Requests' || twitterJSON.title === 'Client Forbidden') {
    return jsonResponseBuilder(
      { error: 'Twitter\'s API does not seem to be working right now,please try again later' },
      { status: 503 }
    );
  }
  if (twitterJSON.errors) {
    return jsonResponseBuilder(
      { error: (twitterJSON.errors[0].message || twitterJSON.errors[0].detail).replace('.', '') },
      { status: 400 }
    );
  }
  // Check if the tweet has media on it
  if (!(twitterJSON.data && twitterJSON.data.attachments)) {
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
