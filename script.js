var tweet = {heregoestheresponseoftwitterapi}
function getmedialinks(tweet) {
    // Tweet is either private or not available
    if ("errors" in tweet) {
        var error_id = [{
            error: tweet.errors[0].message,
        },];
        return error_id;
    // Tweet has no media attached to it
    } else if (!("extended_entities" in tweet)) {
        var error_media = [{
            error: "Media not found for inputted URL.",
        },];
        return error_media;
    }
    // Success, tweet has media
    return tweet.extended_entities.media
        .map(media => {
            const media_type = media.type
            // If media in the tweet is a video do this
            if (media_type === 'video') {
                const video = media.video_info.variants.filter(variant => variant.bitrate !== undefined)
                video.sort(function (a, b) {
                    return a.bitrate - b.bitrate;
                });
                const return_video_quality = {
                    low: video[0].url,
                }
                if (video[1] && video[1].url) return_video_quality.medium = video[1].url
                if (video[2] && video[2].url) return_video_quality.high = video[2].url
                const return_data_video = {
                    type: media_type,
                    link: return_video_quality,
                }
                return return_data_video;
            }
            // If media in the tweet is a gif do this
            if (media_type === 'animated_gif') {
                const gif = media.video_info.variants.filter(variant => variant.content_type == 'video/mp4')
                const return_data_gif = {
                    type: media_type,
                    width: media.sizes.large.w,
                    height: media.sizes.large.h,
                    link: gif[0].url,
                }
                return return_data_gif;
            }
            // If media in the tweet is a photo or photos do this
            if (media_type === 'photo') {
                const media_link = media.media_url_https;
                const extension = media_link.match(/\.[a-z]+$/gi).shift();
                const media_link_no_extension = media_link.replace(extension, '');
                const file_extension = extension.replace('.', '');
                const full_res = '4096x4096';
                const final_media_link = `${media_link_no_extension}?format=${file_extension}&name=${full_res}`;
                const return_data_image = {
                    type: media_type,
                    link: final_media_link,
                }
                return return_data_image;
            }
        })
        .filter(item => !!item);
}
// Convert result to json
const media_links = getmedialinks(tweet);
const media_links_data = {
    media: media_links
};
const media_links_json = JSON.stringify(media_links_data);
document.write(media_links_json);
