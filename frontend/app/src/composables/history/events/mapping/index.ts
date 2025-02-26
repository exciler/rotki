import { cloneDeep } from 'lodash-es';
import { HistoryEventEntryType } from '@rotki/common';
import type { MaybeRef } from '@vueuse/core';
import type {
  HistoryEventCategoryDetailWithId,
  HistoryEventCategoryMapping,
  HistoryEventTypeData,
} from '@/types/history/events/event-type';
import type { ActionDataEntry } from '@/types/action';

type Event = MaybeRef<{
  eventType: string;
  eventSubtype: string;
  counterparty?: string | null;
  entryType?: string;
  isExit?: boolean;
}>;

export const useHistoryEventMappings = createSharedComposable(() => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te } = useI18n();

  const historyEventTypeData = ref<HistoryEventTypeData>(({
    globalMappings: {},
    eventCategoryDetails: {},
    accountingEventsIcons: {},
    entryTypeMappings: {},
  }));

  const { getTransactionTypeMappings } = useHistoryEventsApi();
  const { notify } = useNotificationsStore();

  const historyEventTypeGlobalMapping = useRefMap(historyEventTypeData, ({ globalMappings }) => globalMappings);

  const historyEventTypeByEntryTypeMapping = useRefMap(
    historyEventTypeData,
    ({ entryTypeMappings }) => entryTypeMappings,
  );

  const historyEventTypes = computed<string[]>(() => Object.keys(get(historyEventTypeGlobalMapping)));

  const historyEventTypesData = useArrayMap(historyEventTypes, (identifier) => {
    const translationId = identifier.split('_').join(' ');
    const translationKey = `backend_mappings.events.history_event_type.${translationId}`;

    return {
      identifier,
      label: te(translationKey) ? t(translationKey) : toSentenceCase(identifier),
    };
  });

  const historyEventSubTypes = computed<string[]>(() =>
    Object.values(get(historyEventTypeGlobalMapping))
      .flatMap(item => Object.keys(item))
      .filter(uniqueStrings),
  );

  const historyEventSubTypesData = useArrayMap(historyEventSubTypes, (identifier) => {
    const translationId = toSnakeCase(identifier);
    const translationKey = `backend_mappings.events.history_event_subtype.${translationId}`;
    return {
      identifier,
      label: te(translationKey) ? t(translationKey) : toSentenceCase(identifier),
    };
  });

  const transactionEventTypesData: ComputedRef<HistoryEventCategoryMapping> = useRefMap(historyEventTypeData, ({ eventCategoryDetails }) => {
    const newEventCategoryDetails = cloneDeep(eventCategoryDetails);
    for (const eventCategory in newEventCategoryDetails) {
      const counterpartyMappings = newEventCategoryDetails[eventCategory].counterpartyMappings;
      for (const counterparty in counterpartyMappings) {
        const label = counterpartyMappings[counterparty].label;
        const translationId = toSnakeCase(label);
        const translationKey = `backend_mappings.events.type.${translationId}`;
        counterpartyMappings[counterparty].label = te(translationKey) ? t(translationKey) : toSentenceCase(label);
      }
    }
    return newEventCategoryDetails;
  });

  const accountingEventsTypeData: Ref<ActionDataEntry[]> = useRefMap(historyEventTypeData, ({ accountingEventsIcons }) =>
    Object.entries(accountingEventsIcons).map(([identifier, icon]) => {
      const translationId = toSnakeCase(identifier);
      const translationKey = `backend_mappings.profit_loss_event_type.${translationId}`;

      return {
        identifier,
        icon,
        label: te(translationKey) ? t(translationKey) : toCapitalCase(identifier),
      };
    }));

  const getEventType = (event: Event): ComputedRef<string | undefined> => computed(() => {
    const { eventType, eventSubtype, entryType, isExit } = get(event);

    let byEntryType;
    if (entryType && entryType === HistoryEventEntryType.ETH_WITHDRAWAL_EVENT) {
      byEntryType = get(historyEventTypeByEntryTypeMapping)[entryType]?.[eventType]?.[eventSubtype]?.[
        isExit ? 'isExit' : 'notExit'
      ];
    }

    return byEntryType || get(historyEventTypeGlobalMapping)[eventType]?.[eventSubtype];
  });

  function getFallbackData(
    showFallbackLabel: boolean,
    eventSubtype: string,
    eventType: string,
  ): HistoryEventCategoryDetailWithId {
    const unknownLabel = t('backend_mappings.events.type.unknown');
    const label = showFallbackLabel ? eventSubtype || eventType || unknownLabel : unknownLabel;

    return {
      identifier: '',
      label,
      icon: 'question-line',
      color: 'error',
      direction: 'neutral',
    };
  }

  const getEventTypeData = (
    event: Event,
    showFallbackLabel = true,
  ): ComputedRef<HistoryEventCategoryDetailWithId> => computed(() => {
    const defaultKey = 'default';
    const type = get(getEventType(event));
    const { counterparty, eventType, eventSubtype } = get(event);
    const counterpartyVal = counterparty || defaultKey;
    const data = type && get(transactionEventTypesData)[type];

    if (type && data) {
      const categoryDetail = data.counterpartyMappings[counterpartyVal] || data.counterpartyMappings[defaultKey];

      if (categoryDetail) {
        return {
          ...categoryDetail,
          identifier: counterpartyVal !== defaultKey ? counterpartyVal : type,
          direction: data.direction,
        };
      }
    }

    return getFallbackData(showFallbackLabel, eventSubtype, eventType);
  });

  const getAccountingEventTypeData = (type: MaybeRef<string>): ComputedRef<ActionDataEntry> => computed(() => {
    const typeVal = get(type);
    return (
      get(accountingEventsTypeData).find(({ identifier }) => identifier === typeVal) || {
        identifier: typeVal,
        icon: 'question-line',
        label: toCapitalCase(typeVal),
      }
    );
  });

  const fetchMappings = async (): Promise<void> => {
    try {
      set(historyEventTypeData, await getTransactionTypeMappings());
    }
    catch (error: any) {
      notify({
        display: true,
        title: t('actions.history_events.fetch_mapping.error.title'),
        message: t('actions.history_events.fetch_mapping.error.description', {
          message: error.message,
        }),
        action: [
          {
            label: t('actions.history_events.fetch_mapping.actions.fetch_again'),
            action: async () => await fetchMappings(),
            icon: 'refresh-line',
          },
        ],
      });
    }
  };

  onBeforeMount(() => {
    startPromise(fetchMappings());
  });

  return {
    historyEventTypeData,
    historyEventTypes,
    historyEventTypesData,
    historyEventSubTypes,
    historyEventSubTypesData,
    transactionEventTypesData,
    getEventType,
    getEventTypeData,
    historyEventTypeGlobalMapping,
    accountingEventsTypeData,
    getAccountingEventTypeData,
    refresh: fetchMappings,
  };
});
