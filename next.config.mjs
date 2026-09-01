/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Publisher images are hot-linked from arbitrary hosts, so the Next image
    // optimizer is not used for them (see ArticleImage). This block only keeps
    // remote patterns permissive if the optimizer is enabled later.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
