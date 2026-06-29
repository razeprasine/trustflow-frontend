const { setupDevPlatform } = process.env.NODE_ENV === 'development'
  ? require('@cloudflare/next-on-pages/next-dev')
  : { setupDevPlatform: () => {} };

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages runs on the edge runtime which doesn't support the
  // Node.js-based i18n middleware Next.js uses internally. We keep the
  // locale list here for `useRouter().locale` support in the Pages Router
  // and handle locale detection via a Cloudflare Pages _middleware instead.
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
};

setupDevPlatform();

module.exports = nextConfig;
