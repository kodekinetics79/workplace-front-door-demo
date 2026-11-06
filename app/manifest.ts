import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "The WorkPlace front door (demo)", short_name: "WorkPlace", start_url: "/", display: "standalone", background_color: "#F2F5F8", theme_color: "#12304A",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
