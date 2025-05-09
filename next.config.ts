import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // If using blob URLs directly for next/image, you might need to configure allowed domains or paths.
    // However, for client-side generated blob URLs, standard <img> tags or direct src usage is typical.
    // next/image works best with predictable remote or local static paths.
    // For dynamic blob URLs, if next/image optimization is desired, a custom loader or proxy might be needed.
    // For simplicity, standard <img> with URL.createObjectURL is used in ImageUploadForm.
    // If switching to next/image for previews and encountering issues:
    // domains: ['blob:'], // This is generally not how blob URLs are handled by next/image.
  },
};

export default nextConfig;
