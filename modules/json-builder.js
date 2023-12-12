// Build the response
const jsonBuilder = (json, isSelectorEnabled) => {
  return {
    media: json.map((media) => {
      let mediaTweet;
      const mediaType = media.type;
      // Photos
      if (mediaType === 'photo') {
        const [extension] = media.media_url_https.match(/\.[a-z]+$/gi);
        const photoLink = media.media_url_https.replace(extension, '');
        const photoExtension = extension.replace('.', '');
        const finalPhotoLink = `${photoLink}?format=${photoExtension}&name=orig`;
        mediaTweet = {
          type: mediaType,
          link: finalPhotoLink
        };
        return mediaTweet;
      }
      // Video & GIFs
      const videoVariants = media.video_info.variants
        .filter((variant) => variant.bitrate !== undefined)
        .sort((a, b) => a.bitrate - b.bitrate)
        .slice(-3);
      // Quality selector
      if (isSelectorEnabled && mediaType === 'video') {
        const videoQualities = {
          low: videoVariants[0].url,
        };
        // Append other qualities if available
        if (videoVariants[1] && videoVariants[1].url) videoQualities.medium = videoVariants[1].url;
        if (videoVariants[2] && videoVariants[2].url) videoQualities.high = videoVariants[2].url;
        mediaTweet = {
          type: 'selector',
          link: videoQualities
        };
        return mediaTweet;
      }
      // Return only highest video resultion
      mediaTweet = {
        type: mediaType,
        link: videoVariants[videoVariants.length - 1].url
      };
      // Only return sizes for GIFs
      if (mediaType === 'animated_gif') {
        mediaTweet.width = media.sizes.large.w;
        mediaTweet.height = media.sizes.large.h;
      }
      return mediaTweet;
    })
  };
};

export default jsonBuilder;
