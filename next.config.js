/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['ru', 'lv', 'en'],
    defaultLocale: 'ru'
  }
};
module.exports = nextConfig;
