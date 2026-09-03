import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { BackButton, ListFooter, Screen, Text } from '@/ui';
import { usePaginated } from '@/api/hooks/usePaginated';
import { walletService } from '@/api/services';
import { TransactionRow } from '@/features/wallet/components/TransactionRow';
import type { Transaction } from '@/api/schemas/wallet';

type Filter = 'all' | 'credit' | 'debit' | 'pending';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Money in' },
  { id: 'debit', label: 'Money out' },
  { id: 'pending', label: 'Pending' },
];

/** The full ledger. This is the screen support will ask people to open. */
export default function Transactions() {
  const {
    items: all,
    isPending,
    loadMore,
    isLoadingMore,
    hasMore,
    refresh,
    isRefreshing,
  } = usePaginated(['wallet', 'transactions'], (cursor) => walletService.transactions(cursor));
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    if (filter === 'all') return all;
    if (filter === 'pending') return all.filter((t) => t.status === 'pending');
    return all.filter((t: Transaction) => t.direction === filter);
  }, [all, filter]);

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Transactions</Text>
        <View className="w-10" />
      </View>

      <View className="mt-4 flex-row gap-2">
        {FILTERS.map((option) => {
          const active = option.id === filter;
          return (
            <Pressable
              key={option.id}
              onPress={() => setFilter(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`h-9 justify-center rounded-lg border px-3 ${
                active ? 'border-brand-500 bg-brand-500' : 'border-neutral-200'
              }`}
            >
              <Text
                variant="label"
                className={active ? 'font-bold text-white' : 'text-neutral-600'}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        refreshing={isRefreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          <ListFooter loading={isLoadingMore} hasMore={hasMore} count={items.length} />
        }
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-100" />}
        ListEmptyComponent={
          <Text variant="body" className="mt-16 text-center text-neutral-400">
            {isPending ? 'Loading...' : 'Nothing to show for this filter.'}
          </Text>
        }
        renderItem={({ item }) => <TransactionRow item={item} />}
      />
    </Screen>
  );
}
