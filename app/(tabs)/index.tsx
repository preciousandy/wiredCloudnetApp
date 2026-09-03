import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Text } from '@/ui';
import {
  CategoryChips,
  HeroBanner,
  HomeSkeleton,
  LiveNowRow,
  SectionRow,
  WalletChip,
} from '@/features/catalog/components';
import { useHome } from '@/features/catalog/hooks/useHome';
import { toApiError } from '@/api/errors';

export default function Home() {
  const { data, isPending, isError, error, refetch, isRefetching } = useHome();
  const [category, setCategory] = useState('all');

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const heroTitles = useMemo(
    () => data?.sections.find((s) => s.type === 'hero')?.items ?? [],
    [data],
  );

  const rows = useMemo(() => data?.sections.filter((s) => s.type !== 'hero') ?? [], [data]);

  /**
   * Category filtering runs on the rows we already have rather than refetching.
   * The full catalogue lives behind "See all", so a chip tap should feel instant
   * instead of costing a round trip.
   */
  const visibleRows = useMemo(() => {
    if (category === 'all') return rows;
    const catLower = category.toLowerCase();

    return rows
      .map((section) => {
        // If section title or seeAllQuery matches category (e.g. "Trending", "movies")
        const sectionTitleMatch =
          section.title?.toLowerCase().includes(catLower) ||
          section.seeAllQuery?.toLowerCase().includes(catLower);

        if (sectionTitleMatch) return section;

        const filteredItems = section.items.filter((item) => {
          const kindMatch = item.kind.toLowerCase() === catLower;
          const badgeMatch = item.badge?.toLowerCase().includes(catLower);
          const creatorMatch = item.creator.displayName.toLowerCase().includes(catLower);
          return kindMatch || Boolean(badgeMatch) || creatorMatch;
        });

        return { ...section, items: filteredItems };
      })
      .filter((section) => section.items.length > 0);
  }, [rows, category]);


  return (
    <View className="flex-1 bg-white">
      {/* Light content because the hero artwork runs under the status bar. */}
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#F2702D" />
        }
      >
        {isPending ? <HomeSkeleton /> : null}

        {isError ? (
          <View className="items-center gap-3 px-8 py-24">
            <Text variant="heading" className="text-center">
              We could not load your home feed
            </Text>
            <Text variant="body" className="text-center text-neutral-500">
              {toApiError(error).message}
            </Text>
            <View className="mt-2 w-48">
              <Button label="Try again" variant="secondary" onPress={onRefresh} />
            </View>
          </View>
        ) : null}

        {data ? (
          <>
            {heroTitles.length > 0 ? (
              <HeroBanner titles={heroTitles} balanceLabel={<WalletChip tone="dark" />} />
            ) : null}

            <View className="py-5">
              <CategoryChips
                categories={data.categories}
                value={category}
                onChange={setCategory}
                onLongPress={(id, label) =>
                  router.push(`/browse?category=${id}&title=${encodeURIComponent(label)}`)
                }
              />
            </View>

            {/* Only renders when something is actually live or imminent. */}
            <LiveNowRow />

            {visibleRows.length === 0 ? (
              <View className="items-center gap-2 px-8 py-16">
                <Text variant="heading" className="text-center">
                  Nothing here yet
                </Text>
                <Text variant="body" className="text-center text-neutral-500">
                  We have no titles in this category right now. Try another one.
                </Text>
                <View className="mt-3 w-40">
                  <Button
                    label="Show all"
                    variant="secondary"
                    size="sm"
                    onPress={() => setCategory('all')}
                  />
                </View>
              </View>
            ) : (
              visibleRows.map((section) => <SectionRow key={section.id} section={section} />)
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
