interface TweetMediaItem {
  type: 'photo' | 'video' | 'animated_gif';
  media_url_https: string;
  video_info?: {
    variants: Array<{ bitrate?: number; url: string }>;
  };
  sizes?: {
    large: { w: number; h: number };
  };
}

interface TweetLegacy {
  extended_entities?: {
    media?: TweetMediaItem[];
  };
  retweeted_status_result?: { result?: TweetResultResult };
}

interface TweetResultResult {
  __typename: string;
  legacy?: TweetLegacy;
  reason?: string;
  quoted_status_result?: { result?: TweetResultResult };
  tweet?: TweetResultResult;
}

interface TwitterGraphQLResponse {
  data: {
    tweetResult: { result?: TweetResultResult };
  };
}

interface PhotoMedia {
  type: 'photo';
  link: string;
}

interface VideoMedia {
  type: 'video' | 'animated_gif';
  link: string;
  width?: number;
  height?: number;
}

interface SelectorMedia {
  type: 'selector';
  link: {
    low: string;
    medium?: string;
    high?: string;
  };
}

type MediaResult = PhotoMedia | VideoMedia | SelectorMedia;

interface JsonBuilderResult {
  status: 'success';
  media: MediaResult[];
}

interface ValidatedParams {
  version?: string;
  url?: string;
  selector?: boolean | string;
  id?: string;
  message?: string;
}

type TwitterApiResult = JsonBuilderResult | { status: 'error'; error: Error };

export type {
  TweetMediaItem,
  TweetResultResult,
  TwitterGraphQLResponse,
  MediaResult,
  PhotoMedia,
  VideoMedia,
  SelectorMedia,
  JsonBuilderResult,
  ValidatedParams,
  TwitterApiResult
};
