import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, BackButton, Button, Screen, Skeleton, Text, toast } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { catalogService, profileService, verticalsService } from '@/api/services';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { formatCount } from '@/lib/format';
import { TitleCard } from '@/features/catalog/components';
import type { Vertical } from '@/api/schemas/verticals';

type Tab = 'titles' | 'verticals';

export default function CreatorProfile() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { data: myProfile } = useProfile();
  const [tab, setTab] = useState<Tab>('titles');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const cardWidth = (width - 32 - 12) / 2;
  const gridWidth = (width - 32 - 8) / 3;

  const { data, isPending } = useQuery({
    queryKey: ['creator', handle],
    queryFn: () => catalogService.creator(String(handle)),
    enabled: Boolean(handle),
  });

  const isMe =
    Boolean(myProfile?.user.username && handle && myProfile.user.username.toLowerCase() === String(handle).toLowerCase()) ||
    Boolean(myProfile?.user.id && data?.creator.id && myProfile.user.id === data.creator.id);

  const follow = async () => {
    if (!data) return;
    await verticalsService.toggleFollow(data.creator.id);
    await queryClient.invalidateQueries({ queryKey: ['creator', handle] });
  };

  const changeAvatar = async () => {
    if (!myProfile || updatingAvatar) return;
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
        await profileService.updateProfile(myProfile.user.displayName, myProfile.user.bio ?? '', asset.uri);
        await queryClient.invalidateQueries({ queryKey: ['creator', handle] });
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

  if (isPending || !data) {
    return (
      <Screen>
        <View className="mt-2">
          <BackButton />
        </View>
        <View className="mt-6 gap-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </View>
      </Screen>
    );
  }

  const titlesList = Array.isArray(data.titles) ? data.titles : [];
  const verticals = Array.isArray(data.verticals) ? (data.verticals as Vertical[]) : [];

  return (
    <Screen>
      <View className="mt-2">
        <BackButton />
      </View>

      <View className="mt-5 items-center gap-2">
        <Pressable
          onPress={isMe ? () => void changeAvatar() : undefined}
          disabled={!isMe}
          accessibilityRole={isMe ? 'button' : undefined}
          accessibilityLabel={isMe ? 'Change profile picture' : `${data.creator.displayName}'s picture`}
          className="relative active:opacity-80"
        >
          <Avatar name={data.creator.displayName} uri={data.creator.avatarUrl} size={84} />
          {isMe ? (
            <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-500 shadow-sm">
              {updatingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          ) : null}
        </Pressable>

        <Text variant="title" className="text-center">
          {data.creator.displayName}
        </Text>
        <Text variant="caption">@{data.creator.handle}</Text>

        <View className="mt-2 flex-row items-center gap-6">
          <Stat value={formatCount(data.creator.followerCount)} label="Followers" />
          <Stat value={String(titlesList.length)} label="Titles" />
          <Stat value={String(verticals.length)} label="Verticals" />
        </View>

        <View className="mt-4 w-48">
          {isMe ? (
            <Button
              label="Edit profile"
              variant="secondary"
              onPress={() => router.push('/settings/edit-profile')}
            />
          ) : (
            <Button
              label={data.creator.following ? 'Following' : 'Follow'}
              variant={data.creator.following ? 'secondary' : 'primary'}
              onPress={() => void follow()}
            />
          )}
        </View>
      </View>

      <View className="mt-7 flex-row border-b border-neutral-200">
        {(['titles', 'verticals'] as Tab[]).map((option) => {
          const active = option === tab;
          return (
            <Pressable
              key={option}
              onPress={() => setTab(option)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className={`flex-1 items-center pb-3 ${active ? 'border-b-2 border-brand-500' : ''}`}
            >
              <Text
                variant="label"
                className={active ? 'font-bold text-neutral-900' : 'text-neutral-500'}
              >
                {option === 'titles' ? 'Titles' : 'Verticals'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'titles' ? (
        <FlatList
          key="titles_grid_2"
          data={titlesList}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 16, paddingVertical: 18, paddingBottom: 28 }}
          ListEmptyComponent={<Empty label="No titles published yet." />}
          renderItem={({ item }) => <TitleCard title={item} width={cardWidth} />}
        />
      ) : (
        <FlatList
          key="verticals_grid_3"
          data={verticals}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 4 }}
          contentContainerStyle={{ gap: 4, paddingVertical: 18, paddingBottom: 28 }}
          ListEmptyComponent={<Empty label="No verticals posted yet." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push('/(tabs)/verticals')}
              style={{ width: gridWidth, height: gridWidth * 1.6 }}
              className="overflow-hidden rounded-lg bg-neutral-100 active:opacity-80"
            >
              <Image
                source={{ uri: item.posterUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <View className="absolute bottom-1 left-1 flex-row items-center gap-1 rounded bg-black/40 px-1 py-0.5">
                <Ionicons name="heart" size={11} color="#FFFFFF" />
                <Text variant="caption" className="font-bold text-white">
                  {formatCount(item.likeCount)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text variant="heading">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <View className="items-center gap-2 py-16">
      <Ionicons name="film-outline" size={28} color={neutral[300]} />
      <Text variant="body" className="text-neutral-400">
        {label}
      </Text>
    </View>
  );
}
