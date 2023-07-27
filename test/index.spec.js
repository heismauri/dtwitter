import { Miniflare } from 'miniflare';
import { FormData } from 'undici';

const mf = new Miniflare({
  scriptPath: 'worker.1.1.js',
  envPath: '.dev.vars',
  modules: true,
  port: 1811
});

const buildForm = (url, selector = false) => {
  const form = new FormData();
  form.append('version', '4.0.0');
  form.append('url', url);
  form.append('selector', JSON.stringify({ selector }));
  return form;
};

test('Can download videos', async () => {
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: buildForm('https://twitter.com/i/status/1333078270640795649')
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('video');
  expect(dtwitterAPI.media[0].link).toMatch(/video.twimg.com/);
});

test('Can download videos with quality selector', async () => {
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: buildForm('https://twitter.com/i/status/1333078270640795649', true)
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('selector');
  expect(dtwitterAPI.media[0].link.high).toMatch(/1280x720/);
  expect(dtwitterAPI.media[0].link.medium).toMatch(/640x360/);
  expect(dtwitterAPI.media[0].link.low).toMatch(/480x270/);
});

test('Can download GIFs', async () => {
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: buildForm('https://twitter.com/i/status/1584980589396242432')
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('animated_gif');
  expect(dtwitterAPI.media[0].link).toMatch(/video.twimg.com/);
  expect(dtwitterAPI.media[0].thumbnail).toMatch(/tweet_video_thumb/);
});

test('Can download photos', async () => {
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: buildForm('https://twitter.com/i/status/1331266329819623426')
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media[0].type).toBe('photo');
  expect(dtwitterAPI.media[0].link).toMatch(/pbs.twimg.com/);
});

test('Can download tweets with mixed media', async () => {
  const dtwitterAPI = await mf.dispatchFetch('http://localhost:1811', {
    method: 'POST',
    body: buildForm('https://twitter.com/i/status/1577282815250427907')
  })
    .then((response) => response.json());
  expect(dtwitterAPI).toHaveProperty('media');
  expect(dtwitterAPI.media.length).toBe(6);
  expect(dtwitterAPI.media[0].type).toBe('video');
  expect(dtwitterAPI.media[0].link).toMatch(/video.twimg.com/);
  expect(dtwitterAPI.media[2].type).toBe('photo');
  expect(dtwitterAPI.media[2].link).toMatch(/pbs.twimg.com/);
});

afterAll(async () => {
  await mf.dispose();
});
