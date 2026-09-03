import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, ListFooter, Screen, Skeleton, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { catalogService } from '@/api/services';
import { usePaginated } from '@/api/hooks/usePaginated';
import { TitleCard } from '@/features/catalog/components';
import type { TitleSummary } from '@/api/schemas/catalog';

type SortKey = 'popular' | 'newest' | 'price_low' | 'price_high';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_low', label: 'Price low' },
  { id: 'price_high', label: 'Price high' },
];

type PriceFilter = 'all' | 'free' | 'paid' | 'owned';

const PRICE_FILTERS: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'owned', label: 'Owned' },
];

/**
 * The see-all destination the home rows used to point nowhere from.
 *
 * Sorting and filtering run on loaded pages rather than refetching, which keeps
 * a chip tap instant. When the catalogue is large enough for that to be wrong,
 * these become query parameters and the same UI works unchanged.
 */
export default function Browse() {
  const { category, title } = useLocalSearchParams<{ category?: string; title?: string }>();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;

  const [sort, setSort] = useState<SortKey>('popular');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');

  const categoryId = category ?? 'all';

  const { items, isPending, loadMore, isLoadingMore, hasMore, refresh, isRefreshing } =
    usePaginated(['browse', categoryId], (cursor) =>
      catalogService.byCategory(categoryId, cursor),
    );

  const visible = useMemo(() => {
    let list: TitleSummary[] = [...items];

    if (priceFilter === 'free') list = list.filter((t) => t.access.type === 'free');
    if (priceFilter === 'paid') list = list.filter((t) => t.access.type !== 'free');
    if (priceFilter === 'owned') list = list.filter((t) => t.entitled);

    const priceOf = (t: TitleSummary) => t.access.price?.minor ?? 0;

    if (sort === 'price_low') list.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === 'price_high') list.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === 'newest') list.reverse();

    return list;
  }, [items, priceFilter, sort]);

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading" numberOfLines={1} className="flex-1 text-center">
          {title ?? (categoryId === 'all' ? 'Browse' : categoryId)}
        </Text>
        <View className="w-10" />
      </View>

      <View className="mt-4 gap-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PRICE_FILTERS.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              active={filter.id === priceFilter}
              onPress={() => setPriceFilter(filter.id)}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SORTS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              active={option.id === sort}
              onPress={() => setSort(option.id)}
              subtle
            />
          ))}
        </ScrollView>
      </View>

      {isPending ? (
        <View className="mt-5 flex-row gap-3">
          {[0, 1].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <View style={{ height: cardWidth * 1.45 }}>
                <Skeleton className="h-full w-full" />
              </View>
              <Skeleton className="mt-2 h-3 w-4/5" />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 16, paddingVertical: 16, paddingBottom: 28 }}
          onRefresh={refresh}
          refreshing={isRefreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            <ListFooter loading={isLoadingMore} hasMore={hasMore} count={visible.length} />
          }
          ListEmptyComponent={
            <View className="items-center gap-2 py-20">
              <Ionicons name="funnel-outline" size={28} color={neutral[300]} />
              <Text variant="body" className="text-neutral-400">
                Nothing matches these filters.
              </Text>
            </View>
          }
          renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
        />
      )}
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
  subtle,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  subtle?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-9 justify-center rounded-lg border px-3.5 ${
        active
          ? subtle
            ? 'border-neutral-900 bg-neutral-900'
            : 'border-brand-500 bg-brand-500'
          : 'border-neutral-200'
      }`}
    >
      <Text variant="label" className={active ? 'font-bold text-white' : 'text-neutral-600'}>
        {label}
      </Text>
    </Pressable>
  );
}
