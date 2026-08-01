import type { TweetMediaItem } from "@api/types/TwitterGraphQLResponse";
import type { JsonBuilderResult, MediaResult, VideoMedia } from "@api/types/MediaResult";

// Build the response
const jsonBuilder = (json: TweetMediaItem[], isSelectorEnabled: boolean | string | undefined): JsonBuilderResult => {
  return {
    status: "success",
    media: json.map((media): MediaResult => {
      const mediaType = media.type;
      // Photos
      if (mediaType === "photo") {
        const extensionMatch = media.media_url_https.match(/\.[a-z]+$/gi);
        if (!extensionMatch) throw new Error("Malformed media URL");
        const [extension] = extensionMatch;
        const photoLink = media.media_url_https.replace(extension, "");
        const photoExtension = extension.replace(".", "");
        const finalPhotoLink = `${photoLink}?format=${photoExtension}&name=orig`;
        return {
          type: mediaType,
          link: finalPhotoLink
        };
      }
      // Video & GIFs
      if (!media.video_info) throw new Error("Missing video info");
      const [low, medium, high] = media.video_info.variants
        .filter((variant): variant is { bitrate: number; url: string } => variant.bitrate !== undefined)
        .sort((a, b) => a.bitrate - b.bitrate)
        .slice(-3);
      if (!low) throw new Error("No video variants available");
      // Quality selector
      if (isSelectorEnabled && mediaType === "video") {
        const videoQualities: { low: string; medium?: string; high?: string } = {
          low: low.url
        };
        // Append other qualities if available
        if (medium?.url) videoQualities.medium = medium.url;
        if (high?.url) videoQualities.high = high.url;
        return {
          type: "selector",
          link: videoQualities
        };
      }
      // Return only highest video resultion
      const highestVariant = high ?? medium ?? low;
      const mediaTweet: VideoMedia = {
        type: mediaType,
        link: highestVariant.url
      };
      // Only return sizes for GIFs
      if (mediaType === "animated_gif") {
        if (!media.sizes) throw new Error("Missing media sizes");
        mediaTweet.width = media.sizes.large.w;
        mediaTweet.height = media.sizes.large.h;
      }
      return mediaTweet;
    })
  };
};

export { jsonBuilder };
