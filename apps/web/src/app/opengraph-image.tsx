import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "PlotPin: Find verified rentals on the map";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoPath = join(process.cwd(), "public/plotpin-logo-white.svg");
  const logoData = await readFile(logoPath, "utf8");
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoData).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={248} height={115} />
          <div
            style={{
              marginTop: 48,
              fontSize: 40,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            Find verified rentals on the map
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 26,
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.45,
              maxWidth: 820,
            }}
          >
            Browse for free. Pay once to unlock the landlord.
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.72)",
            letterSpacing: "0.02em",
          }}
        >
          plotpin.net
        </div>
      </div>
    ),
    { ...size },
  );
}
