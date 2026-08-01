const twitterAPIGuestClient = async (env: Env): Promise<string> => {
  const twitterGuestClient = await fetch('https://api.x.com/1.1/guest/activate.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.TOKEN}`
    }
  })
    .then((response) => response.json<{ guest_token: string }>());
  await env.data.put('token', twitterGuestClient.guest_token, {
    metadata: { timestamp: Date.now() }
  });
  return twitterGuestClient.guest_token;
};

const getGuestToken = async (env: Env): Promise<string> => {
  const tokenMaxAge = 15 * 60 * 1000;
  const tokenKV = await env.data.getWithMetadata<{ timestamp: number }>('token');
  let { value: token } = tokenKV;
  if (!token || Date.now() - (tokenKV.metadata?.timestamp ?? 0) >= tokenMaxAge) {
    token = await twitterAPIGuestClient(env);
  }
  return String(token);
};

export { getGuestToken, twitterAPIGuestClient };
