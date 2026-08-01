import worker from "@api/index";
import { env } from "cloudflare:workers";
import { expect, test } from "vitest";

import { latestVersion } from "@api/global-variables";
import type { JsonBuilderResult, PhotoMedia, VideoMedia, SelectorMedia } from "@api/types/MediaResult";

const buildForm = (url: string, selector: boolean | { selector: boolean } = false): FormData => {
  const form = new FormData();
  form.append("version", latestVersion);
  form.append("url", url);
  form.append("selector", JSON.stringify(selector));
  return form;
};

const dispatch = async (url: string, selector?: boolean | { selector: boolean }): Promise<JsonBuilderResult> => {
  const request = new Request("http://localhost/", {
    method: "POST",
    body: buildForm(url, selector)
  });
  const response = await worker.fetch(request, env);
  return response.json<JsonBuilderResult>();
};

test("Can download videos", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1333078270640795649");
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as VideoMedia;
  expect(media.type).toBe("video");
  expect(media.link).toMatch(/video.twimg.com/);
});

test("Can download videos with quality selector as dictionary", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1333078270640795649", { selector: true });
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as SelectorMedia;
  expect(media.type).toBe("selector");
  expect(media.link.high).toMatch(/1280x720/);
  expect(media.link.medium).toMatch(/640x360/);
  expect(media.link.low).toMatch(/480x270/);
});

test("Can download videos with quality selector as boolean", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1333078270640795649", true);
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as SelectorMedia;
  expect(media.type).toBe("selector");
  expect(media.link.high).toMatch(/1280x720/);
  expect(media.link.medium).toMatch(/640x360/);
  expect(media.link.low).toMatch(/480x270/);
});

test("Can download GIFs", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1584980589396242432");
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as VideoMedia;
  expect(media.type).toBe("animated_gif");
  expect(media.link).toMatch(/video.twimg.com/);
  expect(typeof media.width).toBe("number");
  expect(typeof media.height).toBe("number");
});

test("Can download photos", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1331266329819623426");
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as PhotoMedia;
  expect(media.type).toBe("photo");
  expect(media.link).toMatch(/pbs.twimg.com/);
});

test("Can download tweets with mixed media", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1577282815250427907");
  expect(dtwitterAPI).toHaveProperty("media");
  expect(dtwitterAPI.media.length).toBe(4);
  const firstMedia = dtwitterAPI.media[0] as PhotoMedia;
  const secondMedia = dtwitterAPI.media[1] as VideoMedia;
  expect(firstMedia.type).toBe("photo");
  expect(firstMedia.link).toMatch(/pbs.twimg.com/);
  expect(secondMedia.type).toBe("video");
  expect(secondMedia.link).toMatch(/video.twimg.com/);
});

test("Can download media from retweeted tweet", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1802530438973407295");
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as VideoMedia;
  expect(media.type).toBe("video");
  expect(media.link).toMatch(/video.twimg.com/);
});

test("Can download media from quoted tweet", async () => {
  const dtwitterAPI = await dispatch("https://x.com/i/status/1799089472631423474");
  expect(dtwitterAPI).toHaveProperty("media");
  const media = dtwitterAPI.media[0] as PhotoMedia;
  expect(media.type).toBe("photo");
  expect(media.link).toMatch(/pbs.twimg.com/);
});
