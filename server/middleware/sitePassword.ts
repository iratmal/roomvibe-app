import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const COOKIE_NAME = 'rv_site_access';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function makeToken(password: string): string {
  return crypto.createHash('sha256').update(`rv:${password}`).digest('hex');
}

const PASSWORD_PAGE = (message?: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RoomVibe – Private Access</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f7f4;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e2dc;
      border-radius: 16px;
      padding: 48px 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      text-align: center;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .notice {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #e5e2dc;
      border-radius: 10px;
      font-size: 15px;
      outline: none;
      transition: border-color 0.15s;
      margin-bottom: 12px;
      color: #1a1a2e;
    }
    input[type="password"]:focus { border-color: #1a1a2e; }
    button {
      width: 100%;
      padding: 12px;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover { background: #2d2d4e; }
    .error {
      margin-top: 12px;
      font-size: 13px;
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">RoomVibe</div>
    <p class="notice">RoomVibe is currently in private development.</p>
    <form method="POST" action="/__site_auth">
      <input type="hidden" name="redirect" value="/" />
      <input
        type="password"
        name="password"
        placeholder="Enter password"
        autofocus
        autocomplete="current-password"
      />
      <button type="submit">Continue</button>
      ${message ? `<p class="error">${message}</p>` : ''}
    </form>
  </div>
</body>
</html>`;

export function sitePasswordMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sitePassword = process.env.SITE_PASSWORD;

  // Protection is disabled if SITE_PASSWORD is not set
  if (!sitePassword) {
    return next();
  }

  const expectedToken = makeToken(sitePassword);

  // Always allow: Stripe webhooks and the auth POST handler itself
  if (req.path === '/__site_auth' || req.path.startsWith('/api/stripe')) {
    return next();
  }

  // Check cookie
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken === expectedToken) {
    return next();
  }

  // Show password page for all GET/non-POST requests
  if (req.method !== 'POST') {
    res.status(401).send(PASSWORD_PAGE());
    return;
  }

  // Handle password submission (reached via next() above for POST to /__site_auth)
  res.status(401).send(PASSWORD_PAGE('Incorrect password. Please try again.'));
}

export function sitePasswordAuthHandler(req: Request, res: Response): void {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    res.redirect('/');
    return;
  }

  const submitted = (req.body?.password || '').trim();
  if (submitted === sitePassword) {
    const token = makeToken(sitePassword);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/'
    });
    res.redirect(302, '/');
  } else {
    res.status(401).send(PASSWORD_PAGE('Incorrect password. Please try again.'));
  }
}
