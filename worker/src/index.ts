import type { Env } from './env';
import { aggregate, fetchNames, registerName, session, submit } from './data';
import { corsHeaders, json } from './http';
import { sendOtp, verifyOtp } from './otp';
import { reviewConfig, reviewLogin } from './review';

type Handler = (req: Request, env: Env) => Response | Promise<Response>;

const routes: Record<string, Partial<Record<string, Handler>>> = {
  '/aggregate': { GET: aggregate },
  '/fetch_names': { GET: fetchNames },
  '/register_name': { POST: registerName },
  '/submit': { POST: submit },
  '/send_otp': { POST: sendOtp },
  '/verify_otp': { POST: verifyOtp },
  '/session': { GET: session },
  '/review_login/config': { GET: reviewConfig },
  '/review_login': { POST: reviewLogin },
};

async function route(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  const entry = routes[path];
  if (!entry) return json(404, { error: 'Not found' });
  const handler = entry[request.method];
  if (!handler) return json(405, { error: 'Method not allowed' });
  return handler(request, env);
}

export default {
  async fetch(request: Request, env: Env, _ctx?: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    let response: Response;
    try {
      response = await route(request, env);
    } catch (err) {
      console.error('Unhandled error', err);
      response = json(500, { error: 'Internal server error' });
    }
    const out = new Response(response.body, response);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};
