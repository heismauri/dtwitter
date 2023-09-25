const twitterAPIGuestClient = async (env) => {
  const twitterGuestClient = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.TOKEN}`
    }
  })
    .then((response) => response.json());
  await env.data.put('token', twitterGuestClient.guest_token, {
    metadata: { timestamp: Date.now() }
  });
  return twitterGuestClient.guest_token;
};

const getGuestToken = async (env) => {
  const tokenMaxAge = 30 * 60 * 1000;
  const tokenKV = await env.data.getWithMetadata('token');
  let { value: token } = tokenKV;
  if (!token || Date.now() - tokenKV.metadata.timestamp >= tokenMaxAge) {
    token = await twitterAPIGuestClient(env);
  }
  return token;
};

export { getGuestToken, twitterAPIGuestClient };
