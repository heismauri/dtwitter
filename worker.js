import twitterAPIClient from './modules/twitter-api';
import jsonBuilder from './modules/json-builder';
import landingPage from './modules/landing-page';

const shortcutId = '6166';
const shortcutName = 'DTwitter';
const supportedVersions = ['4.1.0'];

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
    return new Response(landingPage(shortcutId, shortcutName, supportedVersions), {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      },
    });
  }
};
