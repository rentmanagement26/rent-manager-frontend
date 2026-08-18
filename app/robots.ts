import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api"], // block crawlers from gated/internal routes once they exist
    },
    sitemap: "https://rentmanagement-liard.vercel.app/", // TODO: real domain
  };
}