"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CountryCatalog } from "@plotpin/shared-types";
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
  viewerContextFromCountry,
  type FormattedMoney,
  type ViewerContext,
} from "@/lib/intl/format-money";
import {
  readStoredViewerCountry,
  resolveViewerCountryCode,
  writeStoredViewerCountry,
} from "@/lib/intl/resolve-viewer-country";
import type { Bounds } from "@/lib/api/buildings";

type ViewerContextValue = {
  ready: boolean;
  viewer: ViewerContext;
  countries: CountryCatalog[];
  countriesByCode: Map<string, CountryCatalog>;
  fxRates: FxRateMap;
  setViewerCountryCode: (code: string) => void;
  getDefaultMapBounds: () => Bounds | null;
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
};

const ViewerContextReact = createContext<ViewerContextValue | null>(null);

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
];

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
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);
  const [countries, setCountries] = useState<CountryCatalog[]>(FALLBACK_COUNTRIES);
  const [fxRates, setFxRates] = useState<FxRateMap>(() =>
    buildFxRateMap(FALLBACK_FX),
  );
  const [viewerCountryCode, setViewerCountryCodeState] = useState("UG");

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

      if (isAuthenticated) {
        try {
          const profile = await fetchMyProfile();
          profileCountry = profile?.country_code ?? null;
        } catch {
          profileCountry = null;
        }
      }

      if (cancelled) return;

      const resolved = resolveViewerCountryCode({
        storedCountry: readStoredViewerCountry(),
        profileCountry,
      });

      setViewerCountryCodeState(resolved);
      setReady(true);
    }

    void resolveViewer();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const onProfileUpdated = () => {
      void fetchMyProfile()
        .then((profile) => {
          if (!profile?.country_code) return;
          const resolved = resolveViewerCountryCode({
            storedCountry: readStoredViewerCountry(),
            profileCountry: profile.country_code,
          });
          setViewerCountryCodeState(resolved);
        })
        .catch(() => undefined);
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
  const viewer = useMemo(
    () => viewerContextFromCountry(activeCountry),
    [activeCountry],
  );

  const setViewerCountryCode = useCallback((code: string) => {
    writeStoredViewerCountry(code);
    setViewerCountryCodeState(code.toUpperCase());
  }, []);

  const getDefaultMapBounds = useCallback((): Bounds | null => {
    const bounds = activeCountry?.mapBounds;
    if (!bounds) return null;
    return bounds;
  }, [activeCountry]);

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

  const value = useMemo<ViewerContextValue>(
    () => ({
      ready,
      viewer,
      countries,
      countriesByCode,
      fxRates,
      setViewerCountryCode,
      getDefaultMapBounds,
      formatListingMoney,
      formatListingRentPerMonth,
    }),
    [
      ready,
      viewer,
      countries,
      countriesByCode,
      fxRates,
      setViewerCountryCode,
      getDefaultMapBounds,
      formatListingMoney,
      formatListingRentPerMonth,
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
