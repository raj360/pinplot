import { youTubeEmbedUrl } from "@/lib/youtube/embed";

export function YouTubeEmbed({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const embedUrl = youTubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="overflow-hidden border border-border bg-black">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
