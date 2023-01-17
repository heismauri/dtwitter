const formElement = document.querySelector('#downloader-form');
const mediaElement = document.querySelector('#downloader-media');

const urlValidator = async (url) => {
  let mainURL = url;
  if (/t.co/.test(mainURL)) {
    mainURL = await fetch(`https://urlexpander.heismauri.com/?url=${mainURL}`)
      .then((response) => response.json())
      .then((data) => data.url);
  }
  return {
    success: /twitter.com/.test(mainURL) && /\d{9,}/.test(mainURL),
    url: mainURL
  };
};

const dtwitterAPI = async (url) => {
  const downloaderForm = new FormData();
  downloaderForm.append('url', url);
  downloaderForm.append('version', currentVersion);
  await fetch('/', {
    method: 'POST',
    body: downloaderForm
  })
    .then((response) => response.json())
    .then((data) => {
      mediaElement.innerHTML = '';
      if (data.error) {
        alert(data.error);
      } else {
        mediaElement.className = 'content';
        data.media.forEach((element) => {
          const htmlMedia = document.createElement('div');
          htmlMedia.className = `media type-${element.type}`;
          if (element.type === 'photo') {
            htmlMedia.innerHTML = `
            <a href="${element.link}" target="_blank"><img src="${element.link}"></a>
            `;
          } else {
            htmlMedia.innerHTML = `
            <a class="btn btn-download" href="${element.link}" target="_blank">Save video</a>
            <video controls>
              <source src="${element.link}" type="video/mp4">
            </video>
            `;
          }
          if (element.type === 'animated_gif') {
            htmlMedia.innerHTML += `<p class="mb-0">You can convert this video into a GIF using <a href="https://ezgif.com/video-to-gif?url=${element.link}">EZGIF</a></p>`;
          }
          mediaElement.insertAdjacentElement('beforeend', htmlMedia);
        });
      }
    });
};

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();
  event.submitter.disabled = true;
  mediaElement.className = '';
  mediaElement.innerHTML = '<div class="ellipsis-loader"><div></div><div></div><div></div><div></div></div>';
  const tweetURL = event.currentTarget.url.value;
  const urlValidatorResponse = await urlValidator(tweetURL);
  if (urlValidatorResponse.success) {
    await dtwitterAPI(urlValidatorResponse.url);
  } else {
    alert('Please insert a valid URL');
    mediaElement.innerHTML = '';
  }
  setTimeout(() => {
    event.submitter.disabled = false;
  }, '2000');
  formElement.scrollIntoView();
});
