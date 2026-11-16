import { defineMiddleware } from 'astro:middleware';

const strip = (p) => p.replace(/\/+$/, '') || '/';

// Request-time gate. Portal sessions arrive in S4; until then /app is closed rather than
// half-open, so nothing appears to work when it does not.
export const onRequest = defineMiddleware((ctx, next) => {
  const path = strip(ctx.url.pathname);
  ctx.locals.user = null;

  if (path.startsWith('/app')) {
    return ctx.redirect('/login/');
  }

  return next();
});
