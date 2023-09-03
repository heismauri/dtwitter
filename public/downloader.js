const formElement = document.getElementById('downloader-form');
const mediaElement = document.getElementById('downloader-media');

const urlValidator = async (url) => {
  try {
    let mainURL = new URL(url).toString();
    if (/https:\/\/t.co/.test(mainURL)) {
      mainURL = await fetch(`https://urlexpander.heismauri.com/?url=${mainURL}`)
        .then((response) => response.json())
        .then((data) => data.url);
    }
    return {
      success: /https:\/\/(twitter|x).com/.test(mainURL) && /\d{9,}/.test(mainURL),
      url: mainURL
    };
  } catch (error) {
    return {
      success: false,
      url
    };
  }
};

const dtwitterAPI = async (url) => {
  const downloaderForm = new FormData();
  downloaderForm.append('url', url);
  downloaderForm.append('version', currentVersion);
  const response = await fetch('/', {
    method: 'POST',
    body: downloaderForm
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error);
  }
  return response.json();
};

const renderMediaElements = (data) => {
  mediaElement.innerHTML = '';
  mediaElement.className = 'content';
  data.media.forEach((media) => {
    const htmlMedia = document.createElement('div');
    htmlMedia.className = `media type-${media.type}`;
    if (media.type === 'photo') {
      htmlMedia.innerHTML = `<a href="${media.link}" target="_blank"><img src="${media.link}"></a>`;
    } else {
      htmlMedia.innerHTML = `
        <a class="btn btn-save" href="${media.link}" target="_blank">Save video</a>
        <video controls ${media.type === 'animated_gif' ? 'autoplay loop' : ''}>
          <source src="${media.link}" type="video/mp4">
        </video>
      `;
    }
    if (media.type === 'animated_gif') {
      htmlMedia.innerHTML += `<p class="mb-0">You can convert this video into a GIF using <a href="https://ezgif.com/video-to-gif?url=${media.link}">EZGIF</a></p>`;
    }
    mediaElement.insertAdjacentElement('beforeend', htmlMedia);
  });
};

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();
  event.submitter.disabled = true;
  const tweetURL = event.currentTarget.url.value;
  if (!tweetURL) {
    setTimeout(() => {
      event.submitter.disabled = false;
    }, '1000');
    return;
  }
  mediaElement.className = '';
  mediaElement.innerHTML = '<div class="ellipsis-loader"><div></div><div></div><div></div><div></div></div>';
  const { success: validUrl, url } = await urlValidator(tweetURL);
  if (!validUrl) {
    const errorMessage = `Please insert a valid URL (${url})`;
    alert(errorMessage);
    mediaElement.innerHTML = '';
    event.submitter.disabled = false;
    throw new Error(errorMessage);
  }
  await dtwitterAPI(url)
    .then(renderMediaElements)
    .catch((error) => {
      alert(error.message);
    });
  setTimeout(() => {
    event.submitter.disabled = false;
  }, '2000');
  formElement.scrollIntoView();
});
