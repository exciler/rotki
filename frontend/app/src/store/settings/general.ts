import { defaultGeneralSettings } from '@/data/factories';
import { type SupportedCurrency, useCurrencies } from '@/types/currencies';
import type { GeneralSettings } from '@/types/user';

export const useGeneralSettingsStore = defineStore('settings/general', () => {
  const { defaultCurrency } = useCurrencies();
  const settings = ref(defaultGeneralSettings(get(defaultCurrency)));

  const uiFloatingPrecision = useComputedRef(settings, 'uiFloatingPrecision');
  const submitUsageAnalytics = useComputedRef(settings, 'submitUsageAnalytics');
  const ksmRpcEndpoint = useComputedRef(settings, 'ksmRpcEndpoint');
  const dotRpcEndpoint = useComputedRef(settings, 'dotRpcEndpoint');
  const beaconRpcEndpoint = useComputedRef(settings, 'beaconRpcEndpoint');
  const balanceSaveFrequency = useComputedRef(settings, 'balanceSaveFrequency');
  const dateDisplayFormat = useComputedRef(settings, 'dateDisplayFormat');
  const mainCurrency = useComputedRef(settings, 'mainCurrency');
  const activeModules = useComputedRef(settings, 'activeModules');
  const btcDerivationGapLimit = useComputedRef(settings, 'btcDerivationGapLimit');
  const displayDateInLocaltime = useComputedRef(settings, 'displayDateInLocaltime');
  const currentPriceOracles = useComputedRef(settings, 'currentPriceOracles');
  const historicalPriceOracles = useComputedRef(settings, 'historicalPriceOracles');
  const ssfGraphMultiplier = useComputedRef(settings, 'ssfGraphMultiplier');
  const inferZeroTimedBalances = useComputedRef(settings, 'inferZeroTimedBalances');
  const nonSyncingExchanges = useComputedRef(settings, 'nonSyncingExchanges');
  const evmchainsToSkipDetection = useComputedRef(settings, 'evmchainsToSkipDetection');
  const treatEth2AsEth = useComputedRef(settings, 'treatEth2AsEth');
  const addressNamePriority = useComputedRef(settings, 'addressNamePriority');
  const queryRetryLimit = useComputedRef(settings, 'queryRetryLimit');
  const connectTimeout = useComputedRef(settings, 'connectTimeout');
  const readTimeout = useComputedRef(settings, 'readTimeout');
  const oraclePenaltyThresholdCount = useComputedRef(settings, 'oraclePenaltyThresholdCount');
  const oraclePenaltyDuration = useComputedRef(settings, 'oraclePenaltyDuration');
  const autoDeleteCalendarEntries = useComputedRef(settings, 'autoDeleteCalendarEntries');
  const autoCreateCalendarReminders = useComputedRef(settings, 'autoCreateCalendarReminders');
  const askUserUponSizeDiscrepancy = useComputedRef(settings, 'askUserUponSizeDiscrepancy');
  const autoDetectTokens = useComputedRef(settings, 'autoDetectTokens');

  const currencySymbol = computed<SupportedCurrency>(() => {
    const currency = get(mainCurrency);
    return currency.tickerSymbol;
  });

  const update = (generalSettings: GeneralSettings): void => {
    set(settings, {
      ...get(settings),
      ...generalSettings,
    });
  };

  return {
    floatingPrecision: uiFloatingPrecision,
    submitUsageAnalytics,
    ksmRpcEndpoint,
    dotRpcEndpoint,
    beaconRpcEndpoint,
    balanceSaveFrequency,
    dateDisplayFormat,
    currency: mainCurrency,
    currencySymbol,
    activeModules,
    btcDerivationGapLimit,
    displayDateInLocaltime,
    currentPriceOracles,
    historicalPriceOracles,
    ssfGraphMultiplier,
    inferZeroTimedBalances,
    nonSyncingExchanges,
    evmchainsToSkipDetection,
    treatEth2AsEth,
    addressNamePriority,
    queryRetryLimit,
    connectTimeout,
    readTimeout,
    oraclePenaltyThresholdCount,
    oraclePenaltyDuration,
    autoDeleteCalendarEntries,
    autoCreateCalendarReminders,
    askUserUponSizeDiscrepancy,
    autoDetectTokens,
    settings,
    update,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGeneralSettingsStore, import.meta.hot));
