import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";

type ProjectSlugRow = {
  slug: string | null;
};

type ProfileUsernameRow = {
  github_username: string | null;
};

export const revalidate = 3600;

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildStaticUrls(siteUrl: string): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/buena-primera-issue`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/activity`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/certificaciones`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/for-maintainers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticUrls = buildStaticUrls(siteUrl);
  const supabase = getPublicClient();

  if (!supabase) {
    return staticUrls;
  }

  const [projectsResult, profilesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("slug")
      .eq("status", "active")
      .not("slug", "is", null),
    supabase
      .from("profiles")
      .select("github_username")
      .not("github_username", "is", null)
      .neq("github_username", ""),
  ]);

  if (projectsResult.error) {
    console.error("Error generando sitemap de proyectos:", projectsResult.error.message);
  }

  if (profilesResult.error) {
    console.error("Error generando sitemap de perfiles:", profilesResult.error.message);
  }

  const projectUrls: MetadataRoute.Sitemap = ((projectsResult.data || []) as ProjectSlugRow[])
    .filter((project) => typeof project.slug === "string" && project.slug.trim().length > 0)
    .map((project) => ({
      url: `${siteUrl}/projects/${encodeURIComponent(project.slug!.trim())}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const profileUrls: MetadataRoute.Sitemap = ((profilesResult.data || []) as ProfileUsernameRow[])
    .filter(
      (profile) =>
        typeof profile.github_username === "string" &&
        profile.github_username.trim().length > 0
    )
    .map((profile) => ({
      url: `${siteUrl}/dev/${encodeURIComponent(profile.github_username!.trim())}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticUrls, ...projectUrls, ...profileUrls];
}
