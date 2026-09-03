import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Screen, Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { profileService } from '@/api/services';
import { useNotifications } from '@/features/profile/hooks/useProfile';
import { formatRelativeTime } from '@/lib/format';
import type { AppNotification } from '@/api/schemas/profile';

const ICONS: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  upload: 'videocam',
  purchase: 'bag-check',
  wallet: 'wallet',
  system: 'information-circle',
  follow: 'person-add',
};

export default function Notifications() {
  const { data, isPending, refetch, isRefetching } = useNotifications();
  const queryClient = useQueryClient();

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const open = async (item: AppNotification) => {
    if (!item.read) {
      await profileService.markRead(item.id);
      await refresh();
    }
    if (item.href) router.push(item.href as never);
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Notifications</Text>
        <View className="w-10 items-end">
          {unread > 0 ? (
            <Pressable
              onPress={async () => {
                await profileService.markAllRead();
                await refresh();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Ionicons name="checkmark-done" size={20} color={brand[500]} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void refetch()}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-100" />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-24">
            <Ionicons name="notifications-off-outline" size={30} color={neutral[300]} />
            <Text variant="body" className="text-neutral-400">
              {isPending ? 'Loading...' : 'Nothing new right now.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void open(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            className={`flex-row items-start gap-3 px-1 py-3.5 ${item.read ? '' : 'bg-brand-50/40'}`}
          >
            <View
              className={`h-9 w-9 items-center justify-center rounded-lg ${
                item.read ? 'bg-neutral-100' : 'bg-brand-50'
              }`}
            >
              <Ionicons
                name={ICONS[item.type]}
                size={17}
                color={item.read ? neutral[500] : brand[600]}
              />
            </View>

            <View className="flex-1">
              <Text variant="label" className={item.read ? '' : 'font-bold text-neutral-900'}>
                {item.title}
              </Text>
              <Text variant="caption" className="mt-0.5 text-neutral-500">
                {item.body}
              </Text>
              <Text variant="caption" className="mt-1 text-neutral-400">
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>

            {!item.read ? <View className="mt-2 h-2 w-2 rounded-full bg-brand-500" /> : null}
          </Pressable>
        )}
      />
    </Screen>
  );
}
