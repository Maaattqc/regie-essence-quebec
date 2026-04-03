import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",

  sendDefaultPii: false,

  tracesSampleRate: 0.1,

  enableLogs: true,
});

// Capture les transitions de navigation App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
