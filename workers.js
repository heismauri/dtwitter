// Connecting to Twitter API 1.1
addEventListener('fetch', event => {
    event.respondWith(handleMedia(event.request));
});
const twitterMedia = async request => {
    const ourl = new URL(request.url);
    const id = ourl.searchParams.get('id');
    const url = 'https://api.twitter.com/1.1/statuses/show.json?tweet_mode=extended&id=' + id;
    const resp = await fetch(url, {
        headers: {
            Authorization: ('Bearer ' + 'TOKEN')
        }
    });
    // Success!
    const selector_enable = ourl.searchParams.get('picker');
    const tweet = await resp.json();
    // Getting the media from the available tweet
    function getmedialinks(tweet) {
        // Private or wrong ID
        if ('errors' in tweet) {
            const message = tweet.errors[0].message.replace('.', '');
            const error_message = {
                error: message,
            };
            return error_message;
        // Tweet does not have any media
        } else if (!('extended_entities' in tweet)) {
            const error_media = {
                error: 'Media not found for inputted URL',
            };
            return error_media;
        }
        // Success!
        return tweet.extended_entities.media
            .map(media => {
                const media_type = media.type;
                // Video Selector
                if (selector_enable === 'true' && media_type === 'video') {
                    const video = media.video_info.variants.filter(variant => variant.bitrate !== undefined);
                    video.sort(function (a, b) {
                        return a.bitrate - b.bitrate;
                    });
                    const return_video_quality = {
                        low: video[0].url,
                    };
                    if (video[1] && video[1].url) return_video_quality.medium = video[1].url;
                    if (video[2] && video[2].url) return_video_quality.high = video[2].url;
                    const return_data_selector = {
                        type: 'picker',
                        link: return_video_quality,
                    };
                    return return_data_selector;
                }
                // Video & GIF
                if (media_type === 'animated_gif' || media_type === 'video') {
                    const video_gif = media.video_info.variants.filter(variant => variant.content_type == 'video/mp4');
                    video_gif.sort(function (a, b) {
                        return b.bitrate - a.bitrate;
                    });
                    const return_data_video_gif = {
                        type: media_type,
                        link: video_gif[0].url,
                    };
                    if (media_type === 'animated_gif') return_data_video_gif.width = media.sizes.large.w, return_data_video_gif.height = media.sizes.large.h;
                    return return_data_video_gif;
                }
                // Photo
                if (media_type === 'photo') {
                    const media_link = media.media_url_https;
                    const extension = media_link.match(/\.[a-z]+$/gi).shift();
                    const main_link = media_link.replace(extension, '');
                    const file_extension = extension.replace('.', '');
                    const final_media_link = main_link + '?format=' + file_extension + '&name=4096x4096';
                    const return_data_image = {
                        type: media_type,
                        link: final_media_link,
                    };
                    return return_data_image;
                }
            })
            .filter(item => !!item);
    }
    const media_links = getmedialinks(tweet);
    const media_links_data = {
        media: media_links,
    };
    return new Response(JSON.stringify(media_links_data), { status: 200 });
};
async function handleMedia(request) {
    return await twitterMedia(request);
}
