import type { NextConfig } from "next";

const FEATURE_PAGES = [
  "resume-builder",
  "resume-analyzer",
  "cover-letter",
  "interviewer",
  "leaderboard",
  "profile",
];

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  async rewrites() {
    return [
      ...FEATURE_PAGES.flatMap((page) => [
        { source: `/${page}`, destination: `/${page}/index.html` },
        { source: `/${page}/`, destination: `/${page}/index.html` },
      ]),
      { source: "/job-listings", destination: "/job-listings/index.html" },
      { source: "/job-listings/", destination: "/job-listings/index.html" },
      { source: "/job-listings/job-detail", destination: "/job-listings/job-detail.html" },
    ];
  },
};

export default nextConfig;
