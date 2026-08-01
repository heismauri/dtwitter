export interface PhotoMedia {
  type: "photo";
  link: string;
}

export interface VideoMedia {
  type: "video" | "animated_gif";
  link: string;
  width?: number;
  height?: number;
}

export interface SelectorMedia {
  type: "selector";
  link: {
    low: string;
    medium?: string;
    high?: string;
  };
}

export type MediaResult = PhotoMedia | VideoMedia | SelectorMedia;

export interface JsonBuilderResult {
  status: "success";
  media: MediaResult[];
}
