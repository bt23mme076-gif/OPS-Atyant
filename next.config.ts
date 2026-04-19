import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@hello-pangea/dnd'],
  },
}
export default nextConfig
