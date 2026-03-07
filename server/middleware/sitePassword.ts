import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { isStagingHost, getRequestHost } from '../utils/envDetection.js';

const COOKIE_NAME = 'rv_site_access';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function generateToken(password: string): string {
  return crypto.createHash('sha256').update(`rv_site_${password}`).digest('hex').slice(0, 32);
}

const PASSWORD_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoomVibe – Private Access</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f3f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1a1a1a;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      text-align: center;
    }
    .logo { height: 56px; margin-bottom: 24px; }
    .message {
      font-size: 14px;
      color: #6b6b6b;
      margin-bottom: 32px;
      line-height: 1.5;
    }
    .input-group { margin-bottom: 16px; }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: #264C61; }
    button {
      width: 100%;
      padding: 12px;
      background: #264C61;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #1d3a4b; }
    .error {
      color: #c53030;
      font-size: 13px;
      margin-top: 12px;
      display: none;
    }
    .error.visible { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <img src="/roomvibe-logo-transparent.png" alt="RoomVibe" class="logo" />
    <p class="message">RoomVibe is currently in private development.</p>
    <form method="POST" action="/__site_auth">
      <input type="hidden" name="redirect" value="__REDIRECT__" />
      <div class="input-group">
        <input type="password" name="password" placeholder="Enter password" autofocus required />
      </div>
      <button type="submit">Enter</button>
      <p class="error __ERROR_CLASS__">Incorrect password. Please try again.</p>
    </form>
  </div>
</body>
</html>`;

export function sitePasswordMiddleware(req: Request, res: Response, next: NextFunction) {
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return next();
  }

  const host = getRequestHost(req);
  if (!isStagingHost(host)) {
    return next();
  }

  if (req.path === '/__site_auth' && req.method === 'POST') {
    return next();
  }

  const token = generateToken(sitePassword);
  const cookieToken = req.cookies?.[COOKIE_NAME];

  if (cookieToken === token) {
    return next();
  }

  const html = PASSWORD_PAGE_HTML
    .replace('__REDIRECT__', req.originalUrl)
    .replace('__ERROR_CLASS__', '');
  res.status(401).send(html);
}

export function sitePasswordAuthHandler(req: Request, res: Response) {
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return res.redirect('/');
  }

  const { password, redirect } = req.body || {};
  const redirectUrl = redirect || '/';

  if (password === sitePassword) {
    const token = generateToken(sitePassword);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
    return res.redirect(redirectUrl);
  }

  const html = PASSWORD_PAGE_HTML
    .replace('__REDIRECT__', redirectUrl)
    .replace('__ERROR_CLASS__', 'visible');
  res.status(401).send(html);
}
