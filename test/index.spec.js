import { Miniflare } from 'miniflare';
import { FormData } from 'undici';

const latestVersion = '3.2.0';
const mf = new Miniflare({
  scriptPath: 'worker.1.1.js',
  envPath: '.dev.vars',
  modules: true,
  port: 1811
});

test('Can download videos', async () => {
  const form = new FormData();
  form.append('version', latestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1333078270640795649');
  form.append('selector', '{"selector":false}');
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: form
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('video');
  expect(dtwitterAPI.media[0].link).toMatch(/video.twimg.com/);
});

test('Can download videos with quality selector', async () => {
  const form = new FormData();
  form.append('version', latestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1333078270640795649');
  form.append('selector', '{"selector":true}');
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: form
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('selector');
  expect(dtwitterAPI.media[0].link.high).toMatch(/1280x720/);
  expect(dtwitterAPI.media[0].link.medium).toMatch(/640x360/);
  expect(dtwitterAPI.media[0].link.low).toMatch(/480x270/);
});

test('Can download GIFs', async () => {
  const form = new FormData();
  form.append('version', latestVersion);
  form.append('url', 'https://twitter.com/ITZYofficial/status/1584980589396242432');
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: form
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('animated_gif');
  expect(dtwitterAPI.media[0].link).toMatch(/video.twimg.com/);
  expect(typeof dtwitterAPI.media[0].width).toBe('number');
  expect(typeof dtwitterAPI.media[0].height).toBe('number');
});

test('Can download photos', async () => {
  const form = new FormData();
  form.append('version', latestVersion);
  form.append('url', 'https://twitter.com/KDA_MUSIC/status/1331266329819623426');
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: form
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('photo');
  expect(dtwitterAPI.media[0].link).toMatch(/pbs.twimg.com/);
});

test('Can download tweets with mixed media', async () => {
  const form = new FormData();
  form.append('version', latestVersion);
  form.append('url', 'https://twitter.com/aespa_official/status/1577282815250427907');
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: form
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('photo');
  expect(dtwitterAPI.media[0].link).toMatch(/pbs.twimg.com/);
  expect(dtwitterAPI.media[1].type).toBe('video');
  expect(dtwitterAPI.media[1].link).toMatch(/video.twimg.com/);
});
