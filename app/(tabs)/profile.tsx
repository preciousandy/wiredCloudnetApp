import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  ListGroup,
  ListRow,
  MoneyText,
  Screen,
  Skeleton,
  Text,
  toast,
} from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { profileService } from '@/api/services';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { useNotifications } from '@/features/profile/hooks/useProfile';

export default function Profile() {
  const { data, isPending } = useProfile();
  const { data: wallet } = useWallet();
  const { data: notifications } = useNotifications();
  const queryClient = useQueryClient();
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const unread = notifications?.items.filter((n) => !n.read).length ?? 0;

  const changeAvatar = async () => {
    if (!data || updatingAvatar) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('Permission needed to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    const asset = result.assets?.[0];
    if (asset?.uri) {
      setUpdatingAvatar(true);
      try {
        await profileService.updateProfile(data.user.displayName, data.user.bio ?? '', asset.uri);
        await queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success('Profile photo updated');
      } catch {
        toast.error('Failed to update photo');
      } finally {
        setUpdatingAvatar(false);
      }
    }
  };

  return (
    <Screen>
      <View className="mt-3 flex-row items-center justify-between">
        <Text variant="title">Profile</Text>
        <Pressable
          onPress={() => router.push('/notifications')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Notifications, ${unread} unread`}
          className="h-10 w-10 items-center justify-center rounded-lg border border-neutral-200"
        >
          <Ionicons name="notifications-outline" size={18} color={neutral[700]} />
          {unread > 0 ? (
            <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
          ) : null}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-5 flex-row items-center gap-4">
          {isPending || !data ? (
            <>
              <Skeleton className="h-16 w-16 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </View>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => void changeAvatar()}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
                className="relative active:opacity-80"
              >
                <Avatar name={data.user.displayName} uri={data.user.avatarUrl} size={68} />
                <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-500 shadow-sm">
                  {updatingAvatar ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>

              <View className="flex-1">
                <Text variant="heading">{data.user.displayName}</Text>
                <Text variant="caption">@{data.user.username}</Text>
                {data.user.isCreator ? (
                  <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-lg bg-brand-50 px-2 py-0.5">
                    <Ionicons name="videocam" size={11} color={brand[600]} />
                    <Text variant="caption" className="font-bold text-brand-700">
                      Creator
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>

        {data?.user.bio ? (
          <Text variant="body" className="mt-3 text-neutral-600">
            {data.user.bio}
          </Text>
        ) : null}

        <View className="mt-5 flex-row justify-between rounded-lg border border-neutral-200 px-2 py-4">
          <Stat value={String(data?.stats.purchases ?? 0)} label="Owned" />
          <Divider />
          <Stat value={String(data?.stats.watchlist ?? 0)} label="Saved" />
          <Divider />
          <Stat value={String(data?.stats.following ?? 0)} label="Following" />
          <Divider />
          <Stat value={`${data?.stats.hoursWatched ?? 0}h`} label="Watched" />
        </View>

        <Pressable
          onPress={() => router.push('/wallet')}
          accessibilityRole="button"
          accessibilityLabel="Open your wallet"
          className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand-50 p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
            <Ionicons name="wallet" size={19} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text variant="caption" className="text-brand-700">
              Wallet balance
            </Text>
            {wallet ? (
              <MoneyText value={wallet.balance} variant="heading" className="text-brand-700" />
            ) : (
              <Skeleton className="mt-1 h-5 w-24" />
            )}
          </View>
          <Ionicons name="chevron-forward" size={17} color={brand[600]} />
        </Pressable>

        <ListGroup title="Your content">
          <ListRow
            first
            icon="bookmark-outline"
            label="Watchlist"
            value={String(data?.stats.watchlist ?? 0)}
            onPress={() => router.push('/watchlist')}
          />
          <ListRow
            icon="albums-outline"
            label="Library"
            description="Titles you own"
            onPress={() => router.push('/(tabs)/library')}
          />
          <ListRow
            icon="receipt-outline"
            label="Purchase history"
            onPress={() => router.push('/wallet/transactions')}
          />
          <ListRow
            icon="radio-outline"
            label="Live events"
            onPress={() => router.push('/live')}
          />
        </ListGroup>

        <ListGroup title="Creating">
          <ListRow
            first
            icon="cloud-upload-outline"
            label="Upload with CloudIt"
            onPress={() => router.push('/(tabs)/cloudit')}
          />
          <ListRow
            icon="stats-chart-outline"
            label="Creator dashboard"
            onPress={() => router.push('/creator/dashboard')}
          />
          <ListRow
            icon="albums-outline"
            label="My uploads"
            onPress={() => router.push('/creator/manage')}
          />
          <ListRow
            icon="cash-outline"
            label="Earnings and payouts"
            onPress={() => router.push('/creator/dashboard')}
          />
          <ListRow
            icon="person-circle-outline"
            label="View public profile"
            onPress={() => router.push(`/creator/${data?.user.username ?? 'cloudnet'}`)}
          />
        </ListGroup>

        <ListGroup title="Account">
          <ListRow
            first
            icon="create-outline"
            label="Edit profile"
            onPress={() => router.push('/settings/edit-profile')}
          />
          <ListRow
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
          <ListRow
            icon="notifications-outline"
            label="Notifications"
            value={unread > 0 ? `${unread} new` : undefined}
            onPress={() => router.push('/notifications')}
          />
        </ListGroup>

        <ListGroup title="Support">
          <ListRow
            first
            icon="help-circle-outline"
            label="Help and FAQ"
            onPress={() => router.push('/help')}
          />
          <ListRow
            icon="chatbubble-ellipses-outline"
            label="Contact support"
            onPress={() => router.push('/support')}
          />
          <ListRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push('/legal/terms')}
          />
          <ListRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
          <ListRow
            icon="people-outline"
            label="Community Guidelines"
            onPress={() => router.push('/legal/guidelines')}
          />
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text variant="heading">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function Divider() {
  return <View className="w-px bg-neutral-200" />;
}
