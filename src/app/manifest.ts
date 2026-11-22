import type { MetadataRoute } from 'next'
import { CITY_NAME, SITE_DESCRIPTION, SITE_NAME } from '@/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: CITY_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'fullscreen',
    background_color: '#1C1F2B',
    theme_color: '#1C1F2B',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
