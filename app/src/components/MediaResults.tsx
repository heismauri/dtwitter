import { type JSX } from "react";

import type { MediaResult } from "@api/types/MediaResult";

const resolveVideoLink = (media: MediaResult): string => {
  if (media.type === "selector") {
    return media.link.high ?? media.link.medium ?? media.link.low;
  }
  return media.link;
};

const MediaResults = ({ media }: { media: MediaResult[] }): JSX.Element => {
  return (
    <>
      {media.map((item, index) => {
        if (item.type === "photo") {
          return (
            <div key={index} className={`media type-${item.type}`}>
              <a href={item.link} target="_blank" rel="noreferrer">
                <img src={item.link} alt="" />
              </a>
            </div>
          );
        }
        const link = resolveVideoLink(item);
        return (
          <div key={index} className={`media type-${item.type}`}>
            <a className="btn btn-save" href={link} target="_blank" rel="noreferrer">
              Save video
            </a>
            <video controls autoPlay={item.type === "animated_gif"} loop={item.type === "animated_gif"}>
              <source src={link} type="video/mp4" />
            </video>
            {item.type === "animated_gif" && (
              <p className="mb-0">
                You can convert this video into a GIF using{" "}
                <a href={`https://ezgif.com/video-to-gif?url=${link}`} target="_blank" rel="noreferrer">
                  EZGIF
                </a>
              </p>
            )}
          </div>
        );
      })}
    </>
  );
};

export default MediaResults;
