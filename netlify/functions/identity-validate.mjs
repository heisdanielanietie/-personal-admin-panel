// Public registration; Netlify Identity handles passwords and email confirmation.
export const handler = async (event) => {
  try {
    const { user } = JSON.parse(event.body || '{}');
    if (typeof user?.email !== 'string' || !user.email.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'An email address is required.' }) };
    }
    return { statusCode: 200, body: '{}' };
  } catch {
    return { statusCode: 400, body: 'Invalid request' };
  }
};
