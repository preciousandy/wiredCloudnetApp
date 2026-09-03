import { FlatList, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Screen, Skeleton, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { useWatchlist } from '@/features/profile/hooks/useProfile';
import { TitleCard } from '@/features/catalog/components';

/** Saved for later. Separate from Library, which is what the user actually owns. */
export default function Watchlist() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32 - 12) / 2;
  const { data, isPending, refetch, isRefetching } = useWatchlist();

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Watchlist</Text>
        <View className="w-10" />
      </View>

      {isPending ? (
        <View className="mt-6 flex-row gap-3">
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
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 16, paddingVertical: 18, paddingBottom: 28 }}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View className="items-center gap-3 py-24">
              <Ionicons name="bookmark-outline" size={32} color={neutral[300]} />
              <Text variant="heading" className="text-center">
                Nothing saved yet
              </Text>
              <Text variant="body" className="text-center text-neutral-500">
                Tap the bookmark on any title to keep it here for later.
              </Text>
              <View className="mt-2 w-44">
                <Button label="Browse titles" onPress={() => router.push('/(tabs)')} />
              </View>
            </View>
          }
          renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
        />
      )}
    </Screen>
  );
}
