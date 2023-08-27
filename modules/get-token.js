const twitterAPIGuestClient = async (env) => {
  const twitterGuestClient = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.TOKEN}`
    }
  })
    .then((response) => response.json());
  await env.guest.put('token', twitterGuestClient.guest_token, {
    metadata: { timestamp: Date.now() }
  });
  return twitterGuestClient.guest_token;
};

const getGuestToken = async (env) => {
  const cacheMaxAge = 30 * 60 * 1000;
  const KVCache = await env.guest.getWithMetadata('token');
  let { value: token } = KVCache;
  const { metadata } = KVCache;
  if (!token || Date.now() - metadata.timestamp >= cacheMaxAge) {
    token = await twitterAPIGuestClient(env);
  }
  return token;
};

export { getGuestToken, twitterAPIGuestClient };
