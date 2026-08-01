export interface TweetMediaItem {
  type: "photo" | "video" | "animated_gif";
  media_url_https: string;
  video_info?: {
    variants: { bitrate?: number; url: string }[];
  };
  sizes?: {
    large: { w: number; h: number };
  };
}

export interface TweetLegacy {
  extended_entities?: {
    media?: TweetMediaItem[];
  };
  retweeted_status_result?: { result?: TweetResultResult };
}

export interface TweetResultResult {
  __typename: string;
  legacy?: TweetLegacy;
  reason?: string;
  quoted_status_result?: { result?: TweetResultResult };
  tweet?: TweetResultResult;
}

export interface TwitterGraphQLResponse {
  data: {
    tweetResult: { result?: TweetResultResult };
  };
}
