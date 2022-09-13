import fetch from 'node-fetch';
import FormData from 'form-data';

const LatestVersion = '3.0.8';

test('Can download videos', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1333078270640795649');
  const requestAPI = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  const responseJSON = await requestAPI.json();
  expect(responseJSON.media[0].type).toBe('video');
  expect(responseJSON.media[0].link).toMatch(/video.twimg.com/);
});

test('Can download videos with quality selector', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1333078270640795649');
  form.append('selector', '{"selector":true}');
  const requestAPI = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  const responseJSON = await requestAPI.json();
  expect(responseJSON.media[0].type).toBe('selector');
  expect(responseJSON.media[0].link.high).toMatch(/video.twimg.com/);
});

test('Can download GIFs', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/yeji_gif/status/1568177615865020416');
  const requestAPI = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  const responseJSON = await requestAPI.json();
  expect(responseJSON.media[0].type).toBe('animated_gif');
  expect(responseJSON.media[0].link).toMatch(/video.twimg.com/);
  expect(typeof responseJSON.media[0].width).toBe('number');
  expect(typeof responseJSON.media[0].height).toBe('number');
});

test('Can download photos', async () => {
  const form = new FormData();
  form.append('version', LatestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1331266329819623426');
  const requestAPI = await fetch('http://localhost:8787', {
    method: 'POST',
    body: form
  });
  const responseJSON = await requestAPI.json();
  expect(responseJSON.media[0].type).toBe('photo');
  expect(responseJSON.media[0].link).toMatch(/pbs.twimg.com/);
});
