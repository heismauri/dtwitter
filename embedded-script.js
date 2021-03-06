<script>    
    var selector_enable = '';
    var tweet = {twitter_response};
    function getmedialinks(tweet) {
        if ('errors' in tweet) {
            var message = tweet.errors[0].message.replace('.', '');
            var error_message = {
                error: message,
            };
            return error_message;
        } else if (!('extended_entities' in tweet)) {
            var error_media = {
                error: 'Media not found for inputted URL',
            };
            return error_media;
        }
        return tweet.extended_entities.media
            .map(media => {
                const media_type = media.type;
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
                    }
                    return return_data_selector;
                }
                if (media_type === 'animated_gif' || media_type === 'video') {
                    const video_gif = media.video_info.variants.filter(variant => variant.bitrate !== undefined);
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
                if (media_type === 'photo') {
                    const media_link = media.media_url_https;
                    const extension = media_link.match(/\.[a-z]+$/gi).shift();
                    const main_link = media_link.replace(extension, '');
                    const file_extension = extension.replace('.', '');
                    const final_media_link = main_link + '?format=' + file_extension + '&name=orig';
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
        media: media_links
    };
    const media_links_json = JSON.stringify(media_links_data);
    document.write(media_links_json);
</script>
