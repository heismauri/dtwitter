import twitterAPIClient from './modules/twitter-api';
import jsonBuilder from './modules/json-builder';

const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['4.1.0'];
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
const objectValidator = (object) => {
  // Check if installed version is a supported one
  if (!object.version || !supportedVersions.includes(object.version)) {
    object.message = `Your current version is outdated. Please download the latest one on https://routinehub.co/shortcut/${shortcutId}/.`;
    return object;
  }
  // Check for valid URL
  if (!object.url) {
    object.message = 'The URL field is required and cannot be left blank.';
    return object;
  }
  if (!(/https:\/\/(twitter|x)\.com\/.*\/\d{18,}/.test(object.url))) {
    object.message = `The provided URL (${object.url}) is not valid.`;
    return object;
  }
  // Check for valid tweet ID
  const tweetID = object.url.match(/\d{18,}/);
  if (!tweetID) {
    object.message = 'The provided Tweet URL seems to have an invalid or missing Tweet ID.';
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

const formToObject = async (request) => {
  try {
    const objectForm = Object.fromEntries(await request.formData());
    return objectValidator(objectForm);
  } catch (error) {
    return { message: 'There was an error processing the form data.' };
  }
};

// Handle POST request
const handlePostRequest = async (request, env) => {
  const params = await formToObject(request);
  if (params.message) {
    return jsonResponseBuilder({ error: params.message }, { status: 400 });
  }
  const twitterJSON = await twitterAPIClient(params.id, env);
  // Check if the API gave any errors
  if (twitterJSON.error) {
    switch (twitterJSON.error.message) {
      case 'notfound':
        return jsonResponseBuilder(
          { error: 'Sorry, the tweet you were looking for could not be found.' },
          { status: 404 }
        );
      case 'nsfw':
        return jsonResponseBuilder(
          { error: 'Sorry, the download has failed due to the presence of NSFW content in the tweet.' },
          { status: 405 }
        );
      case 'empty':
        return jsonResponseBuilder(
          { error: 'Sorry, no media could be found for the provided URL.' },
          { status: 404 }
        );
      default:
        return jsonResponseBuilder(
          { error: "Twitter's API does not seem to be working right now. Please try again later. Contact @heismauri on Twitter/X if the problem persists." },
          { status: 503 }
        );
    }
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
