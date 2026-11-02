const LOCALES = ['en', 'es', 'hi'];

export const unstable_settings = {
  matcher: { methods: ['GET', 'HEAD'] },
};

// Keeps legacy /en, /es and /hi URLs working: drop the prefix and remember the language in a cookie.
export default function middleware(request: Request) {
  const url = new URL(request.url);
  const [, first, ...rest] = url.pathname.split('/');
  if (!LOCALES.includes(first)) return;

  const target = `/${rest.join('/')}${url.search}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Set-Cookie': `lang=${first}; Path=/; Max-Age=31536000; SameSite=Lax`,
    },
  });
}
