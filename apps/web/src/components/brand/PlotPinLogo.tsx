import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const ASSETS = {
  icon: { src: "/plotpin-icon.svg", width: 77, height: 114 },
  white: { src: "/plotpin-logo-white.svg", width: 99, height: 46 },
  colored: { src: "/plotpin-logo-colored.svg", width: 99, height: 46 },
} as const;

type Variant = keyof typeof ASSETS;

type PlotPinLogoProps = {
  variant?: Variant;
  /** Render height in px; width scales from asset aspect ratio. */
  height?: number;
  className?: string;
  href?: string | null;
  priority?: boolean;
};

export function PlotPinLogo({
  variant = "colored",
  height = variant === "icon" ? 40 : 28,
  className,
  href = "/",
  priority = false,
}: PlotPinLogoProps) {
  const asset = ASSETS[variant];
  const width = Math.round((asset.width / asset.height) * height);

  const image = (
    <Image
      src={asset.src}
      alt="PlotPin"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto shrink-0", className)}
      style={{ height, width: "auto", maxWidth: width }}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {image}
    </Link>
  );
}
