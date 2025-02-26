<script setup lang="ts">
import type { BaseSuggestion, SearchMatcher, Suggestion } from '@/types/filtering';

const props = defineProps<{
  matchers: SearchMatcher<any>[];
  selectedMatcher?: SearchMatcher<any>;
  keyword: string;
  selectedSuggestion: number;
}>();

const emit = defineEmits<{
  (e: 'click', item: SearchMatcher<any>): void;
  (e: 'suggest', item: Suggestion): void;
  (e: 'apply-filter', item: Suggestion): void;
}>();

const { keyword, selectedMatcher, selectedSuggestion } = toRefs(props);

const keywordSplited = computed(() => splitSearch(get(keyword)));

const lastSuggestion = ref<Suggestion | null>(null);
const suggested = ref<Suggestion[]>([]);

function updateSuggestion(value: Suggestion[], index: number) {
  set(lastSuggestion, value[index]);
  emit('suggest', {
    ...value[index],
    index,
    total: value.length,
  });
}

function click(matcher: SearchMatcher<any>) {
  emit('click', matcher);
}

function applyFilter(item: Suggestion) {
  const value = typeof item.value === 'string' ? item.value : item.value.symbol;
  if (value)
    emit('apply-filter', item);
}

watch(selectedSuggestion, (index) => {
  updateSuggestion(get(suggested), index);
});

watch(suggested, (value) => {
  if (value.length > 0) {
    if (get(lastSuggestion) !== value[0])
      updateSuggestion(value, 0);
  }
  else {
    set(lastSuggestion, null);
    emit('suggest', { key: '', index: 0, total: 0 } as Suggestion);
  }
});

watch(
  [keyword, selectedMatcher],
  async ([keyword, selectedMatcher]) => {
    if (!keyword || !selectedMatcher)
      return [];

    const search = splitSearch(keyword);
    const exclude = 'string' in selectedMatcher && !!selectedMatcher.allowExclusion && !!search.exclude;

    const suggestedFilter = selectedMatcher.key;

    const searchString = search.value ?? '';

    let suggestedItems: BaseSuggestion[] = [];

    if ('string' in selectedMatcher) {
      suggestedItems = selectedMatcher.suggestions().map(item => ({
        key: suggestedFilter,
        value: item,
        exclude,
      }));
    }
    else if ('asset' in selectedMatcher) {
      if (searchString) {
        suggestedItems = (await selectedMatcher.suggestions(searchString)).map(asset => ({
          key: suggestedFilter,
          value: asset,
          exclude,
        }));
      }
    }
    else if ('boolean' in selectedMatcher) {
      suggestedItems = [
        {
          key: suggestedFilter,
          value: true,
          exclude: false,
        },
      ];
    }
    else {
      logger.debug('Matcher doesn\'t have asset=true, string=true, or boolean=true.', selectedMatcher);
    }

    const getItemText = (item: BaseSuggestion) =>
      typeof item.value === 'string' ? item.value : `${item.value.symbol} ${item.value.evmChain}`;

    set(
      suggested,
      suggestedItems
        .sort((a, b) => {
          const aText = getItemText(a);
          const bText = getItemText(b);
          return compareTextByKeyword(aText, bText, searchString);
        })
        .slice(0, 5)
        .map((a, index) => ({
          index,
          key: a.key,
          value: a.value,
          asset: typeof a.value !== 'string',
          total: suggestedItems.length,
          exclude,
        })),
    );
  },
  { immediate: true },
);

const { t } = useI18n();

watch(selectedSuggestion, async () => {
  if (get(selectedMatcher))
    return;

  await nextTick(() => {
    document.getElementsByClassName('highlightedMatcher')[0]?.scrollIntoView?.({ block: 'nearest' });
  });
});

const highlightedTextClasses = 'text-subtitle-2 text-rui-text-secondary';
</script>

<template>
  <div class="px-4 py-1">
    <div v-if="selectedMatcher">
      <div
        v-if="suggested.length > 0"
        class="mb-2"
        :class="$style.suggestions"
        data-cy="suggestions"
      >
        <RuiButton
          v-for="(item, index) in suggested"
          :key="item.index"
          :tabindex="index"
          variant="text"
          class="text-body-1 tracking-wide w-full justify-start text-left text-rui-text-secondary"
          :class="{
            ['!bg-rui-primary-lighter/20']: index === selectedSuggestion,
          }"
          @click="applyFilter(item)"
        >
          <SuggestedItem :suggestion="item" />
        </RuiButton>
      </div>
      <div
        v-else
        class="pb-0"
      >
        <div class="text-rui-text-secondary">
          <i18n-t
            v-if="!('asset' in selectedMatcher)"
            keypath="table_filter.no_suggestions"
            tag="span"
          >
            <template #search>
              <span class="font-medium text-rui-primary">
                {{ keywordSplited.key }}
              </span>
            </template>
          </i18n-t>
          <template v-else>
            {{ t('table_filter.asset_suggestion') }}
          </template>
        </div>
      </div>

      <div
        v-if="'string' in selectedMatcher && selectedMatcher.allowExclusion"
        :class="highlightedTextClasses"
        class="font-light pt-2"
      >
        {{ t('table_filter.exclusion.description') }}
        <span class="font-medium">
          {{ t('table_filter.exclusion.example') }}
        </span>
      </div>

      <div
        v-if="selectedMatcher.hint"
        :class="highlightedTextClasses"
        class="text-wrap"
      >
        {{ selectedMatcher.hint }}
      </div>
    </div>
    <div
      v-else-if="keyword && matchers.length === 0"
      class="pb-2"
    >
      <span>{{ t('table_filter.unsupported_filter') }}</span>
      <span class="font-medium ms-2">{{ keyword }}</span>
    </div>
    <div v-if="!selectedMatcher && matchers.length > 0">
      <div
        :class="highlightedTextClasses"
        class="uppercase font-bold"
      >
        {{ t('table_filter.title') }}
      </div>
      <RuiDivider class="my-2" />
      <div
        :class="$style.suggestions"
        data-cy="suggestions"
      >
        <FilterEntry
          v-for="(matcher, index) in matchers"
          :key="matcher.key"
          :active="index === selectedSuggestion"
          :matcher="matcher"
          :class="{ highlightedMatcher: index === selectedSuggestion }"
          @click="click($event)"
        />
      </div>
    </div>
    <div
      :class="highlightedTextClasses"
      class="font-light mt-2"
    >
      <RuiDivider class="my-2" />
      <span>{{ t('table_filter.hint.description') }}</span>
      <span class="font-medium">
        {{ t('table_filter.hint.example') }}
      </span>
      <div>
        {{ t('table_filter.hint_filter') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.suggestions {
  @apply max-h-[12rem] overflow-y-auto;
}
</style>
