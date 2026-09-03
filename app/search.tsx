import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, ListFooter, Screen, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { catalogService } from '@/api/services';
import { usePaginated } from '@/api/hooks/usePaginated';
import { useRecentSearches } from '@/store/recentSearches';
import { TitleCard } from '@/features/catalog/components';

const SUGGESTIONS = ['Drama', 'Comedy', 'Documentary', 'Lagos', 'Music', 'Thriller'];
const MIN_QUERY = 2;

export default function Search() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const [debounced, setDebounced] = useState(q ?? '');
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;

  const recent = useRecentSearches();

  useEffect(() => {
    if (!recent.hydrated) void recent.hydrate();
  }, [recent]);

  /**
   * Debounced so a four letter word does not fire four searches. Also the point
   * at which we remember the term: recording every keystroke would fill the
   * recent list with fragments.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
      if (query.trim().length >= MIN_QUERY) recent.remember(query);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = debounced.trim().length >= MIN_QUERY;

  const { items, isPending, loadMore, isLoadingMore, hasMore } = usePaginated(
    ['search', debounced],
    (cursor) => catalogService.search(debounced, cursor),
    { enabled: active },
  );

  return (
    <Screen>
      <View className="mt-2 flex-row items-center gap-3">
        <BackButton />
        <View className="h-11 flex-1 flex-row items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3">
          <Ionicons name="search" size={17} color={neutral[400]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search movies, music, creators"
            placeholderTextColor={neutral[400]}
            autoFocus
            returnKeyType="search"
            accessibilityLabel="Search"
            className="flex-1 text-[15px] text-neutral-900"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={17} color={neutral[400]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!active ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {recent.queries.length > 0 ? (
            <View className="mt-6">
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="caption" className="uppercase tracking-widest">
                  Recent
                </Text>
                <Text
                  variant="caption"
                  className="font-bold text-brand-500"
                  onPress={recent.clear}
                >
                  Clear
                </Text>
              </View>

              {recent.queries.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setQuery(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search again for ${item}`}
                  className="flex-row items-center gap-3 py-3"
                >
                  <Ionicons name="time-outline" size={17} color={neutral[400]} />
                  <Text variant="body" className="flex-1">
                    {item}
                  </Text>
                  <Pressable onPress={() => recent.forget(item)} hitSlop={8} accessibilityLabel={`Remove ${item}`}>
                    <Ionicons name="close" size={15} color={neutral[300]} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View className="mt-6">
            <Text variant="caption" className="mb-2 uppercase tracking-widest">
              Try searching for
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => setQuery(suggestion)}
                  accessibilityRole="button"
                  className="h-9 justify-center rounded-lg border border-neutral-200 px-3.5"
                >
                  <Text variant="label" className="text-neutral-600">
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 16, paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            <ListFooter loading={isLoadingMore} hasMore={hasMore} count={items.length} />
          }
          ListEmptyComponent={
            <View className="items-center gap-2 py-20">
              <Ionicons name="search-outline" size={28} color={neutral[300]} />
              <Text variant="body" className="text-center text-neutral-400">
                {isPending ? 'Searching...' : `Nothing found for "${debounced}"`}
              </Text>
            </View>
          }
          renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
        />
      )}
    </Screen>
  );
}
