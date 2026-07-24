/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    // Nur ein kleines statisches Logo -> keine Runtime-Optimierung nötig
    // (vermeidet Cache-Schreibfehler im Standalone-Container).
    unoptimized: true,
  },
};

module.exports = nextConfig;
