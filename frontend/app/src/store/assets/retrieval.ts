import { AssetInfo } from '@rotki/common/lib/data';
import { MaybeRef } from '@vueuse/core';
import { ComputedRef } from 'vue';
import { useAssetInfoApi } from '@/services/assets/info';
import { useAssetCacheStore } from '@/store/assets/asset-cache';
import { ERC20Token } from '@/store/balances/types';
import { useNotifications } from '@/store/notifications';
import { useGeneralSettingsStore } from '@/store/settings/general';
import { useTasks } from '@/store/tasks';
import { TaskMeta } from '@/types/task';
import { TaskType } from '@/types/task-type';
import { getAddressFromEvmIdentifier, isEvmIdentifier } from '@/utils/assets';

export const useAssetInfoRetrieval = defineStore(
  'assets/infoRetrievals',
  () => {
    const { erc20details } = useAssetInfoApi();
    const { retrieve, cachedEntries } = useAssetCacheStore();
    const { treatEth2AsEth } = storeToRefs(useGeneralSettingsStore());
    const { tc } = useI18n();
    const { notify } = useNotifications();
    const { awaitTask } = useTasks();

    const assetAssociationMap: ComputedRef<Record<string, string>> = computed(
      () => {
        const associationMap: Record<string, string> = {};
        if (get(treatEth2AsEth)) {
          associationMap['ETH2'] = 'ETH';
        }
        return associationMap;
      }
    );

    const getAssociatedAssetIdentifier = (
      identifier: string
    ): ComputedRef<string> =>
      computed(() => {
        return get(assetAssociationMap)[identifier] ?? identifier;
      });

    const assetInfo = (
      identifier: MaybeRef<string | undefined>,
      enableAssociation: MaybeRef<boolean> = true
    ): ComputedRef<AssetInfo | null> =>
      computed(() => {
        const id = get(identifier);
        if (!id) return null;

        const key = enableAssociation
          ? get(getAssociatedAssetIdentifier(id))
          : id;

        return get(retrieve(key));
      });

    const assetSymbol = (
      identifier: MaybeRef<string | undefined>,
      enableAssociation: MaybeRef<boolean> = true
    ): ComputedRef<string> =>
      computed(() => {
        const id = get(identifier);
        if (!id) return '';

        const symbol = get(assetInfo(id, enableAssociation))?.symbol;

        if (symbol) return symbol;

        if (isEvmIdentifier(id)) {
          const address = getAddressFromEvmIdentifier(id);
          return `EVM Token: ${address}`;
        }

        return '';
      });

    const assetName = (
      identifier: MaybeRef<string>,
      enableAssociation: MaybeRef<boolean> = true
    ): ComputedRef<string> =>
      computed(() => {
        const id = get(identifier);
        if (!id) return '';

        const name = get(assetInfo(id, enableAssociation))?.name;
        if (name) return name;

        if (isEvmIdentifier(id)) {
          const address = getAddressFromEvmIdentifier(id);
          return `EVM Token: ${address}`;
        }

        return '';
      });

    const tokenAddress = (
      identifier: string,
      enableAssociation: boolean = true
    ): ComputedRef<string> =>
      computed(() => {
        if (!identifier) return '';
        const id = enableAssociation
          ? get(getAssociatedAssetIdentifier(identifier))
          : identifier;
        return getAddressFromEvmIdentifier(id);
      });

    const assetIdentifierForSymbol = (symbol: string) => {
      for (const [identifier, value] of get(cachedEntries)) {
        if (value.symbol === symbol) {
          return identifier;
        }
      }

      console.trace(`request for identifier for: ${symbol}`);
      return '';
    };

    const fetchTokenDetails = async (address: string): Promise<ERC20Token> => {
      try {
        const taskType = TaskType.ERC20_DETAILS;
        const { taskId } = await erc20details(address);
        const { result } = await awaitTask<ERC20Token, TaskMeta>(
          taskId,
          taskType,
          {
            title: tc('actions.assets.erc20.task.title', 0, { address }),
            numericKeys: []
          }
        );
        return result;
      } catch (e: any) {
        notify({
          title: tc('actions.assets.erc20.error.title', 0, { address }),
          message: tc('actions.assets.erc20.error.description', 0, {
            message: e.message
          }),
          display: true
        });
        return {};
      }
    };

    return {
      fetchTokenDetails,
      getAssociatedAssetIdentifier,
      assetIdentifierForSymbol,
      assetInfo,
      assetSymbol,
      assetName,
      tokenAddress
    };
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useAssetInfoRetrieval, import.meta.hot)
  );
}