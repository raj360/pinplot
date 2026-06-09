import type { ClusterStats, Renderer } from "@googlemaps/markerclusterer";
import { MarkerUtils } from "@googlemaps/markerclusterer";
import { EXPLORE_MAP_CLUSTER_COLORS } from "@/lib/maps/config";

function clusterFillColor(count: number): string {
  if (count >= 20) return EXPLORE_MAP_CLUSTER_COLORS.large;
  if (count >= 10) return EXPLORE_MAP_CLUSTER_COLORS.medium;
  return EXPLORE_MAP_CLUSTER_COLORS.small;
}

function buildClusterSvg(count: number, fill: string): string {
  return `<svg fill="${fill}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="50" height="50">
<circle cx="120" cy="120" opacity=".65" r="70" />
<circle cx="120" cy="120" opacity=".35" r="90" />
<circle cx="120" cy="120" opacity=".2" r="110" />
<text x="50%" y="50%" style="fill:#fff" text-anchor="middle" font-size="50" dominant-baseline="middle" font-family="system-ui, sans-serif" font-weight="600">${count}</text>
</svg>`;
}

/** PlotPin-branded cluster bubbles — separate palette from building pins. */
export class PlotPinClusterRenderer implements Renderer {
  render(
    { count, position }: {
      count: number;
      position: google.maps.LatLng | google.maps.LatLngLiteral;
    },
    _stats: ClusterStats,
    map: google.maps.Map,
  ) {
    const fill = clusterFillColor(count);
    const svg = buildClusterSvg(count, fill);
    const title = `${count} listings in this area`;
    const zIndex = Number(google.maps.Marker.MAX_ZINDEX) + count;

    if (MarkerUtils.isAdvancedMarkerAvailable(map)) {
      const parser = new DOMParser();
      const svgEl = parser.parseFromString(svg, "image/svg+xml").documentElement;
      svgEl.setAttribute("transform", "translate(0 25)");

      return new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        zIndex,
        title,
        content: svgEl,
      });
    }

    return new google.maps.Marker({
      position,
      zIndex,
      title,
      icon: {
        url: `data:image/svg+xml;base64,${btoa(svg)}`,
        anchor: new google.maps.Point(25, 25),
      },
    });
  }
}
