"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_COUNTRY, type CountryCatalog, type RentPeriod } from "@plotpin/shared-types";
import {
  fetchCountryCatalogClient,
  fetchFxRatesClient,
  type FxRateEntry,
} from "@/lib/api/catalog";
import { fetchMyProfile } from "@/lib/api/profiles";
import { useAuth } from "@/lib/auth/use-auth";
import { buildFxRateMap, type FxRateMap } from "@/lib/intl/fx-rates";
import {
  formatMoney,
  formatRentPerMonthWithFootnote,
  formatRentWithPeriod,
  formatViewerMoney,
  type FormattedMoney,
  type ViewerContext,
  formatCanonicalUgxForViewer,
} from "@/lib/intl/format-money";
import {
  readStoredViewerCountry,
  resolveViewerCountryCode,
  resolveViewerContext,
  writeStoredViewerCountry,
  clearStoredViewerCountry,
} from "@/lib/intl/resolve-viewer-country";
import { fetchIpCountry } from "@/lib/intl/geo-ip";
import { fetchGeoPlacesClient, type GeoPlace } from "@/lib/api/geo-places";
import {
  resolveCountryMapBounds,
  resolveCountryMapCenter,
} from "@/lib/maps/country-map-defaults";
import type { Bounds } from "@/lib/api/buildings";

type ViewerContextValue = {
  ready: boolean;
  viewer: ViewerContext;
  countries: CountryCatalog[];
  countriesByCode: Map<string, CountryCatalog>;
  fxRates: FxRateMap;
  setViewerCountryCode: (code: string) => void;
  resetViewerCountryOverride: () => Promise<void>;
  getDefaultMapBounds: () => Bounds | null;
  /** Major-city center near the viewer's region for the listing picker. */
  getDefaultMapCenter: () => { lat: number; lng: number };
  formatListingMoney: (
    amount: number,
    listingCurrency: string,
    listingCountryCode?: string,
  ) => FormattedMoney;
  formatListingRentPerMonth: (
    amount: number | null | undefined,
    listingCurrency: string,
    listingCountryCode?: string,
  ) => string;
  /** Listing rent with /mo or /night suffix — viewer currency first. */
  formatListingRent: (
    amount: number | null | undefined,
    listingCurrency: string,
    listingCountryCode?: string,
    period?: RentPeriod,
  ) => string;
  /** Format a canonical-UGX fee (e.g. unlock fee) in the viewer's currency. */
  formatUnlockFee: (amountUgx: number) => string;
  /** Unlock fee for hero/marketing — viewer currency first, UGX footnote when different. */
  formatUnlockFeeLabel: (amountUgx: number) => FormattedMoney;
};

const ViewerContextReact = createContext<ViewerContextValue | null>(null);

/** Minimal currency/locale rows so SSR + first paint render the right name and
 *  currency for the cookie-resolved country before the full catalog loads. Map
 *  bounds are seeded only for UG; other markets resolve via geo_places at runtime. */
const FALLBACK_COUNTRIES: CountryCatalog[] = [
  {
    code: "UG",
    name: "Uganda",
    currency: "UGX",
    displayLocale: "en-UG",
    mapCenter: { lat: 0.3476, lng: 32.5825 },
    mapBounds: { north: 0.4, south: 0.28, east: 32.72, west: 32.52 },
    defaultMapZoom: 13,
  },
  ...(
    [
      ["GB", "United Kingdom", "GBP", "en-GB"],
      ["US", "United States", "USD", "en-US"],
      ["KE", "Kenya", "KES", "en-KE"],
      ["TZ", "Tanzania", "TZS", "en-TZ"],
      ["RW", "Rwanda", "RWF", "en-RW"],
      ["NG", "Nigeria", "NGN", "en-NG"],
      ["ZA", "South Africa", "ZAR", "en-ZA"],
      ["AE", "United Arab Emirates", "AED", "en-AE"],
      ["CA", "Canada", "CAD", "en-CA"],
      ["DE", "Germany", "EUR", "de-DE"],
      ["IE", "Ireland", "EUR", "en-IE"],
      ["NL", "Netherlands", "EUR", "nl-NL"],
      ["FR", "France", "EUR", "fr-FR"],
      ["IT", "Italy", "EUR", "it-IT"],
      ["ES", "Spain", "EUR", "es-ES"],
      ["BE", "Belgium", "EUR", "nl-BE"],
      ["SE", "Sweden", "SEK", "sv-SE"],
      ["NO", "Norway", "NOK", "nb-NO"],
      ["DK", "Denmark", "DKK", "da-DK"],
      ["CH", "Switzerland", "CHF", "de-CH"],
      ["SA", "Saudi Arabia", "SAR", "en-SA"],
      ["QA", "Qatar", "QAR", "en-QA"],
      ["AU", "Australia", "AUD", "en-AU"],
      ["NZ", "New Zealand", "NZD", "en-NZ"],
      ["IN", "India", "INR", "en-IN"],
      ["SG", "Singapore", "SGD", "en-SG"],
      ["GH", "Ghana", "GHS", "en-GH"],
    ] as const
  ).map(([code, name, currency, displayLocale]) => ({
    code,
    name,
    currency,
    displayLocale,
    mapCenter: null,
    mapBounds: null,
    defaultMapZoom: 12,
  })),
];

/** Offline bootstrap only — live rates come from GET /api/v1/fx/rates (open.er-api.com). */
const FALLBACK_FX: FxRateEntry[] = [
  { baseCurrency: "UGX", quoteCurrency: "UGX", rate: 1, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "USD", rate: 0.00026, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "GBP", rate: 0.000205, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "KES", rate: 0.034, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "TZS", rate: 0.676, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "RWF", rate: 0.378, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "NGN", rate: 0.432, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "ZAR", rate: 0.00481, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "AED", rate: 0.000955, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "CAD", rate: 0.00019, updatedAt: "" },
  { baseCurrency: "UGX", quoteCurrency: "EUR", rate: 0.000241, updatedAt: "" },
];

export function ViewerContextProvider({
  children,
  initialCountryCode,
}: {
  children: React.ReactNode;
  /** Country resolved from the SSR cookie hint — keeps the first paint correct. */
  initialCountryCode?: string | null;
}) {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(true);
  const [countries, setCountries] = useState<CountryCatalog[]>(FALLBACK_COUNTRIES);
  const [fxRates, setFxRates] = useState<FxRateMap>(() =>
    buildFxRateMap(FALLBACK_FX),
  );
  // Seeded from the server-readable cookie hint so SSR and the first client
  // render are identical (no hydration mismatch) AND show the viewer's real
  // country immediately (no "Uganda" flash). localStorage / browser signals are
  // only consulted after mount.
  const ssrInitialCountry =
    initialCountryCode && /^[A-Za-z]{2}$/.test(initialCountryCode)
      ? initialCountryCode.toUpperCase()
      : DEFAULT_COUNTRY.code;
  const [viewerCountryCode, setViewerCountryCodeState] =
    useState<string>(ssrInitialCountry);
  const [hydrated, setHydrated] = useState(false);
  const [resolutionHints, setResolutionHints] = useState<{
    profileCountry: string | null;
    ipCountry: string | null;
  }>({ profileCountry: null, ipCountry: null });
  const [viewerGeoPlaces, setViewerGeoPlaces] = useState<GeoPlace[]>([]);

  // Apply the stored override immediately after hydration (fast path for
  // returning visitors) before the async profile/IP resolution completes.
  useEffect(() => {
    setHydrated(true);
    const stored = readStoredViewerCountry();
    if (stored) setViewerCountryCodeState(stored);
  }, []);

  // Persist the resolved country to a server-readable cookie so the next refresh
  // can render the correct country on the first paint (kills the UG flash).
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.cookie = `plotpin-country-hint=${viewerCountryCode}; path=/; max-age=31536000; samesite=lax`;
  }, [viewerCountryCode]);

  useEffect(() => {
    let cancelled = false;
    const code = viewerCountryCode.trim().toUpperCase();
    if (!code) {
      setViewerGeoPlaces([]);
      return;
    }

    void fetchGeoPlacesClient(code)
      .then((rows) => {
        if (!cancelled) setViewerGeoPlaces(rows);
      })
      .catch(() => {
        if (!cancelled) setViewerGeoPlaces([]);
      });

    return () => {
      cancelled = true;
    };
  }, [viewerCountryCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const [countryRows, rateRows] = await Promise.all([
          fetchCountryCatalogClient(),
          fetchFxRatesClient(),
        ]);
        if (cancelled) return;
        if (countryRows.length > 0) setCountries(countryRows);
        if (rateRows.length > 0) setFxRates(buildFxRateMap(rateRows));
      } catch {
        /* keep fallbacks */
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveViewer() {
      let profileCountry: string | null = null;

      const profilePromise = isAuthenticated
        ? fetchMyProfile()
            .then((profile) => profile?.country_code ?? null)
            .catch(() => null)
        : Promise.resolve<string | null>(null);

      // Resolve account + edge IP signals in parallel.
      const [resolvedProfile, ipCountry] = await Promise.all([
        profilePromise,
        fetchIpCountry().catch(() => null),
      ]);
      profileCountry = resolvedProfile;

      if (cancelled) return;

      setResolutionHints({ profileCountry, ipCountry });

      const resolved = resolveViewerCountryCode({
        storedCountry: readStoredViewerCountry(),
        profileCountry,
        ipCountry,
      });

      setViewerCountryCodeState(resolved);
    }

    void resolveViewer();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const onProfileUpdated = () => {
      void Promise.all([
        fetchMyProfile()
          .then((profile) => profile?.country_code ?? null)
          .catch(() => null),
        fetchIpCountry().catch(() => null),
      ]).then(([profileCountry, ipCountry]) => {
        setResolutionHints({ profileCountry, ipCountry });
        const resolved = resolveViewerCountryCode({
          storedCountry: readStoredViewerCountry(),
          profileCountry,
          ipCountry,
        });
        setViewerCountryCodeState(resolved);
      });
    };

    window.addEventListener("plotpin:profile-updated", onProfileUpdated);
    return () =>
      window.removeEventListener("plotpin:profile-updated", onProfileUpdated);
  }, []);

  const countriesByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries],
  );

  const activeCountry = countriesByCode.get(viewerCountryCode) ?? countries[0];
  const viewer = useMemo<ViewerContext>(() => {
    // Catalog hit (incl. the SSR fallback rows) → deterministic on server and
    // first client render, so no hydration mismatch and no UG flash.
    const country = countriesByCode.get(viewerCountryCode);
    if (country) {
      return {
        countryCode: viewerCountryCode,
        displayLocale: country.displayLocale,
        displayCurrency: country.currency,
      };
    }
    // Off-catalog before hydration → safe default with no browser reads (keeps
    // SSR === first client render).
    if (!hydrated) {
      return {
        countryCode: viewerCountryCode,
        displayLocale: "en-US",
        displayCurrency: "USD",
      };
    }
    // Off-catalog after hydration → full region-aware resolution.
    return resolveViewerContext(
      {
        storedCountry: viewerCountryCode,
        profileCountry: resolutionHints.profileCountry,
        ipCountry: resolutionHints.ipCountry,
      },
      countriesByCode,
    );
  }, [
    hydrated,
    countriesByCode,
    resolutionHints.ipCountry,
    resolutionHints.profileCountry,
    viewerCountryCode,
  ]);

  const setViewerCountryCode = useCallback((code: string) => {
    writeStoredViewerCountry(code);
    setViewerCountryCodeState(code.toUpperCase());
  }, []);

  const resetViewerCountryOverride = useCallback(async () => {
    clearStoredViewerCountry();
    const [profileCountry, ipCountry] = await Promise.all([
      isAuthenticated
        ? fetchMyProfile()
            .then((profile) => profile?.country_code ?? null)
            .catch(() => null)
        : Promise.resolve<string | null>(null),
      fetchIpCountry().catch(() => null),
    ]);
    setViewerCountryCodeState(
      resolveViewerCountryCode({
        storedCountry: null,
        profileCountry,
        ipCountry,
      }),
    );
    setResolutionHints({ profileCountry, ipCountry });
  }, [isAuthenticated]);

  const getDefaultMapCenter = useCallback((): { lat: number; lng: number } => {
    return resolveCountryMapCenter(activeCountry, viewerGeoPlaces);
  }, [activeCountry, viewerGeoPlaces]);

  const getDefaultMapBounds = useCallback((): Bounds | null => {
    return resolveCountryMapBounds(activeCountry, viewerGeoPlaces);
  }, [activeCountry, viewerGeoPlaces]);

  const formatListingMoney = useCallback(
    (amount: number, listingCurrency: string, listingCountryCode?: string) =>
      formatMoney(amount, listingCurrency, viewer, fxRates, {
        listingCountryCode,
        countriesByCode,
      }),
    [countriesByCode, fxRates, viewer],
  );

  const formatListingRentPerMonth = useCallback(
    (
      amount: number | null | undefined,
      listingCurrency: string,
      listingCountryCode?: string,
    ) =>
      formatRentPerMonthWithFootnote(
        amount,
        listingCurrency,
        viewer,
        fxRates,
        { listingCountryCode, countriesByCode },
      ),
    [countriesByCode, fxRates, viewer],
  );

  const formatListingRent = useCallback(
    (
      amount: number | null | undefined,
      listingCurrency: string,
      listingCountryCode?: string,
      period: RentPeriod = "month",
    ) =>
      formatRentWithPeriod(
        amount,
        listingCurrency,
        viewer,
        fxRates,
        period,
        { listingCountryCode, countriesByCode },
      ),
    [countriesByCode, fxRates, viewer],
  );

  const formatUnlockFee = useCallback(
    (amountUgx: number) => formatViewerMoney(amountUgx, viewer, fxRates),
    [fxRates, viewer],
  );

  const formatUnlockFeeLabel = useCallback(
    (amountUgx: number) => formatCanonicalUgxForViewer(amountUgx, viewer, fxRates),
    [fxRates, viewer],
  );

  const value = useMemo<ViewerContextValue>(
    () => ({
      ready,
      viewer,
      countries,
      countriesByCode,
      fxRates,
      setViewerCountryCode,
      resetViewerCountryOverride,
      getDefaultMapBounds,
      getDefaultMapCenter,
      formatListingMoney,
      formatListingRentPerMonth,
      formatListingRent,
      formatUnlockFee,
      formatUnlockFeeLabel,
    }),
    [
      ready,
      viewer,
      countries,
      countriesByCode,
      fxRates,
      setViewerCountryCode,
      resetViewerCountryOverride,
      getDefaultMapBounds,
      getDefaultMapCenter,
      formatListingMoney,
      formatListingRentPerMonth,
      formatListingRent,
      formatUnlockFee,
      formatUnlockFeeLabel,
    ],
  );

  return (
    <ViewerContextReact.Provider value={value}>
      {children}
    </ViewerContextReact.Provider>
  );
}

export function useViewerContext(): ViewerContextValue {
  const ctx = useContext(ViewerContextReact);
  if (!ctx) {
    throw new Error("useViewerContext must be used within ViewerContextProvider");
  }
  return ctx;
}
