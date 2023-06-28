/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {// by default NextJS has a security feature to prevent loading images from untrusted sources.
    remotePatterns: [
      { // This is done to load images from particular domains. ** means any
        protocol: "https",
        hostname: "**",
      },
    ],
  },
}

module.exports = nextConfig
