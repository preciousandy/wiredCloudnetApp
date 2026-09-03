import { FlatList, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, BackButton, Button, Screen, Text, toast } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { moderationService } from '@/api/services';

export default function BlockedAccounts() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['blocked'],
    queryFn: () => moderationService.blockedUsers(),
  });

  const unblock = async (userId: string) => {
    await moderationService.block(userId);
    await queryClient.invalidateQueries({ queryKey: ['blocked'] });
    toast.success('Unblocked');
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Blocked accounts</Text>
        <View className="w-10" />
      </View>

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item}
        contentContainerStyle={{ paddingVertical: 16 }}
        ItemSeparatorComponent={() => <View className="h-px bg-neutral-100" />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-24">
            <Ionicons name="ban-outline" size={30} color={neutral[300]} />
            <Text variant="body" className="text-neutral-400">
              {isPending ? 'Loading...' : 'You have not blocked anyone.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 py-3">
            <Avatar name={item} size={40} />
            <Text variant="body" className="flex-1">
              {item}
            </Text>
            <Button label="Unblock" size="sm" variant="secondary" onPress={() => void unblock(item)} />
          </View>
        )}
      />
    </Screen>
  );
}
