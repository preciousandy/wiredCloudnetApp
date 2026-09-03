import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  BackButton,
  BottomSheet,
  Button,
  ConfirmDialog,
  ListRow,
  MoneyText,
  Screen,
  Skeleton,
  Text,
  toast,
} from '@/ui';
import { neutral, semantic } from '@/ui/theme/colors';
import { creatorService } from '@/api/services';
import { toApiError } from '@/api/errors';
import { formatCount, formatRelativeTime } from '@/lib/format';
import type { CreatorTitle } from '@/api/schemas/creator';

const MODERATION: Record<
  CreatorTitle['moderation'],
  { label: string; colour: string; background: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  published: { label: 'Live', colour: semantic.success, background: 'bg-success/10', icon: 'checkmark-circle' },
  pending_review: { label: 'In review', colour: semantic.warning, background: 'bg-warning/10', icon: 'time' },
  rejected: { label: 'Rejected', colour: semantic.danger, background: 'bg-danger/10', icon: 'close-circle' },
};

export default function ManageContent() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<CreatorTitle | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CreatorTitle | null>(null);
  const [working, setWorking] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ['creator', 'titles'],
    queryFn: () => creatorService.titles(),
  });

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['creator', 'titles'] }),
      queryClient.invalidateQueries({ queryKey: ['creator', 'overview'] }),
    ]);

  const changeVisibility = async (
    title: CreatorTitle,
    visibility: 'public' | 'unlisted' | 'private',
  ) => {
    setWorking(true);
    try {
      await creatorService.setVisibility(title.id, visibility);
      await refresh();
      toast.success(`${title.title} is now ${visibility}`);
      setSelected(null);
    } catch (cause) {
      const error = toApiError(cause);
      toast.error(
        error.code === 'FORBIDDEN'
          ? 'This has not cleared review yet, so it cannot go public.'
          : error.message,
      );
    } finally {
      setWorking(false);
    }
  };

  const remove = async (title: CreatorTitle) => {
    setWorking(true);
    try {
      await creatorService.remove(title.id);
      await refresh();
      toast.success(`${title.title} removed`);
      setConfirmDelete(null);
      setSelected(null);
    } catch (cause) {
      const error = toApiError(cause);
      toast.error(
        error.details?.reason === 'has_sales'
          ? 'People have paid for this, so it cannot be deleted. Set it to private instead.'
          : error.message,
      );
      setConfirmDelete(null);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">My uploads</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/cloudit')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Upload something new"
          className="h-10 w-10 items-center justify-center rounded-lg border border-neutral-200"
        >
          <Ionicons name="add" size={20} color={neutral[700]} />
        </Pressable>
      </View>

      {isPending ? (
        <View className="mt-5 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </View>
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-px bg-neutral-100" />}
          ListEmptyComponent={
            <View className="items-center gap-3 py-24">
              <Ionicons name="cloud-upload-outline" size={30} color={neutral[300]} />
              <Text variant="heading" className="text-center">
                Nothing uploaded yet
              </Text>
              <View className="mt-1 w-44">
                <Button label="Upload with CloudIt" onPress={() => router.push('/(tabs)/cloudit')} />
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const state = MODERATION[item.moderation];
            return (
              <Pressable
                onPress={() => setSelected(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${state.label}`}
                className="flex-row items-center gap-3 py-3"
              >
                <Image
                  source={{ uri: item.posterUrl }}
                  style={{ width: 46, height: 66, borderRadius: 8 }}
                  contentFit="cover"
                />

                <View className="flex-1">
                  <Text variant="label" numberOfLines={1} className="font-bold">
                    {item.title}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-1.5">
                    <View className={`flex-row items-center gap-1 rounded-lg px-1.5 py-0.5 ${state.background}`}>
                      <Ionicons name={state.icon} size={10} color={state.colour} />
                      <Text variant="caption" className="font-bold" style={{ color: state.colour }}>
                        {state.label}
                      </Text>
                    </View>
                    <Text variant="caption" className="capitalize text-neutral-400">
                      {item.visibility}
                    </Text>
                  </View>

                  <Text variant="caption" className="mt-1 text-neutral-400">
                    {formatCount(item.views)} views · {formatCount(item.sales)} sales ·{' '}
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>

                <View className="items-end gap-1">
                  <MoneyText value={item.revenue} variant="label" className="font-bold" />
                  <Ionicons name="ellipsis-horizontal" size={17} color={neutral[400]} />
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title}
        dismissable={!working}
      >
        {selected ? (
          <View className="pb-2">
            {selected.moderation === 'rejected' && selected.rejectionReason ? (
              <View className="mx-5 mb-3 mt-4 flex-row items-start gap-2 rounded-lg bg-danger/5 p-3">
                <Ionicons name="alert-circle-outline" size={16} color={semantic.danger} />
                <View className="flex-1">
                  <Text variant="label" className="font-bold text-danger">
                    Why this was rejected
                  </Text>
                  <Text variant="caption" className="mt-0.5">
                    {selected.rejectionReason}
                  </Text>
                </View>
              </View>
            ) : null}

            <ListRow
              first
              icon="eye-outline"
              label="Make public"
              description={
                selected.moderation === 'published'
                  ? 'Anyone can find it'
                  : 'Available once review passes'
              }
              onPress={() => void changeVisibility(selected, 'public')}
            />
            <ListRow
              icon="link-outline"
              label="Unlisted"
              description="Only people with the link"
              onPress={() => void changeVisibility(selected, 'unlisted')}
            />
            <ListRow
              icon="lock-closed-outline"
              label="Private"
              description="Hidden from everyone but you"
              onPress={() => void changeVisibility(selected, 'private')}
            />
            <ListRow
              icon="stats-chart-outline"
              label="View performance"
              onPress={() => {
                setSelected(null);
                router.push('/creator/dashboard');
              }}
            />
            <ListRow
              icon="trash-outline"
              label="Delete"
              danger
              onPress={() => setConfirmDelete(selected)}
            />
          </View>
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        visible={confirmDelete !== null}
        tone="danger"
        title="Delete this upload?"
        message={
          confirmDelete && confirmDelete.sales > 0
            ? 'People have paid for this. Deleting is blocked, but you can set it to private.'
            : 'This cannot be undone. The file and its stats are removed.'
        }
        confirmLabel="Delete"
        loading={working}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void remove(confirmDelete)}
      />
    </Screen>
  );
}
