import fetch from 'node-fetch';
import FormData from 'form-data';

const LatestVersion = '3.0.8';

test('Can download videos', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1333078270640795649');
  const dtwitter = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  expect(await dtwitter.text()).toBe('{"media":[{"type":"video","link":"https://video.twimg.com/amplify_video/1331839499974832128/vid/1280x720/Ms9tbyFANiImP9Ki.mp4?tag=13"}]}');
});

test('Can download GIFs', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/yeji_gif/status/1568177615865020416');
  const dtwitter = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  expect(await dtwitter.text()).toBe('{"media":[{"type":"animated_gif","link":"https://video.twimg.com/tweet_video/FcNI7bYacAMyz7W.mp4","width":1000,"height":776}]}');
});

test('Can download photos', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1331266329819623426');
  const dtwitter = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  expect(await dtwitter.text()).toBe('{"media":[{"type":"photo","link":"https://pbs.twimg.com/media/EnjiDehVEAIriDs?format=jpg&name=orig"},{"type":"photo","link":"https://pbs.twimg.com/media/EnjiFW-UYAAQzT6?format=jpg&name=orig"},{"type":"photo","link":"https://pbs.twimg.com/media/EnjiGx_UcAAFTSC?format=jpg&name=orig"}]}');
});
