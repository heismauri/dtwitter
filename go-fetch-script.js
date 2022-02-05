var tweet = tweet
var media_urls = []

function getMediaUrls(tweet) {
  if (!tweet.extended_entities.media) return
  var murls = tweet.extended_entities.media.map(media => {
    var media_type = media.type == 'animated_gif' ? 'video' : media.type
    switch (media_type) {
      case 'video':
        var variants = media.video_info.variants.filter(variant => variant.content_type == 'video/mp4')
        return variants[0].url
        break;
      case 'photo':
        var sizes = ['large', 'medium', 'small', 'thumb']
        var avail = sizes.filter(size => {
          return !!media.sizes[size]
        })
        var media_url = media.media_url_https
        var extension = media_url.match(/\.[a-z]+$/gi)
        media_url = media_url.replace(extension, '')
        extension = ('' + extension).replace('.', '')
        var max_size = avail[0]
        max_size = '4096x4096' // hack for 4k
        media_url = media_url + '?format=' + extension + '&name=' + max_size
        return media_url
        break;
      default:
        return null
    }
  })
  murls = murls.filter(item => !!item)
  return murls;
}
media_urls = getMediaUrls(tweet)
document.write(JSON.stringify({
  urls: media_urls
}))
