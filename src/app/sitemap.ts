import type { MetadataRoute } from 'next';
import { PDF_TOOLS } from '@/data/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kelolapdf.web.id';

  const toolEntries: MetadataRoute.Sitemap = PDF_TOOLS.map((tool) => ({
    url: `${baseUrl}/alat/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sitemap.html`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...toolEntries,
  ];
}
