import { useMemo } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen, Skeleton, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { catalogService } from '@/api/services';
import { useEntitlements } from '@/features/wallet/hooks/useEntitlements';
import { TitleCard } from '@/features/catalog/components';

/**
 * Everything the user owns.
 *
 * Entitlements come from the server, so this list is the same source of truth
 * the player checks before it will start. What appears here is exactly what
 * will play.
 */
export default function Library() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;

  const { data: entitlements, isPending } = useEntitlements();

  const ids = useMemo(
    () => (entitlements?.items ?? []).map((e) => e.titleId),
    [entitlements],
  );

  const { data: titles } = useQuery({
    queryKey: ['library', 'titles', ids],
    queryFn: async () => Promise.all(ids.map((id) => catalogService.detail(id))),
    enabled: ids.length > 0,
  });

  return (
    <Screen>
      <View className="mb-4 mt-4">
        <Text variant="title">Your library</Text>
        <Text variant="body" className="mt-1 text-neutral-500">
          Titles you own, ready to watch any time.
        </Text>
      </View>

      {isPending ? (
        <View className="flex-row gap-3">
          {[0, 1].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <View style={{ height: cardWidth * 1.45 }}>
                <Skeleton className="h-full w-full" />
              </View>
              <Skeleton className="mt-2 h-3 w-4/5" />
            </View>
          ))}
        </View>
      ) : ids.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Ionicons name="bookmark-outline" size={34} color={neutral[300]} />
          <Text variant="heading" className="text-center">
            Nothing here yet
          </Text>
          <Text variant="body" className="text-center text-neutral-500">
            Anything you buy shows up here and stays available.
          </Text>
          <View className="mt-2 w-48">
            <Button label="Browse titles" onPress={() => router.push('/(tabs)')} />
          </View>
        </View>
      ) : (
        <FlatList
          data={titles ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
          renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
        />
      )}
    </Screen>
  );
}
