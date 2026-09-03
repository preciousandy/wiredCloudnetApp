import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Input, ListGroup, ListRow, Screen, Text } from '@/ui';
import { neutral } from '@/ui/theme/colors';
import { FAQ } from '@/copy/legal';

export default function Help() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const results = query.trim()
    ? FAQ.filter(
        (item) =>
          item.q.toLowerCase().includes(query.toLowerCase()) ||
          item.a.toLowerCase().includes(query.toLowerCase()),
      )
    : FAQ;

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Help</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-5">
          <Input
            placeholder="Search help"
            value={query}
            onChangeText={setQuery}
            leftSlot={<Ionicons name="search" size={17} color={neutral[400]} />}
          />
        </View>

        <View className="mt-5">
          {results.length === 0 ? (
            <Text variant="body" className="mt-10 text-center text-neutral-400">
              Nothing matches that. Try contacting support below.
            </Text>
          ) : (
            <View className="overflow-hidden rounded-lg border border-neutral-200">
              {results.map((item, index) => {
                const expanded = open === item.q;
                return (
                  <Pressable
                    key={item.q}
                    onPress={() => setOpen(expanded ? null : item.q)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    className={`px-4 py-3.5 ${index > 0 ? 'border-t border-neutral-100' : ''}`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Text variant="body" className="flex-1 font-medium">
                        {item.q}
                      </Text>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={neutral[400]}
                      />
                    </View>
                    {expanded ? (
                      <Text variant="caption" className="mt-2 text-neutral-600">
                        {item.a}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <ListGroup title="Still stuck">
          <ListRow
            first
            icon="chatbubble-ellipses-outline"
            label="Contact support"
            description="We reply within a day"
            onPress={() => router.push('/support')}
          />
          <ListRow
            icon="document-text-outline"
            label="Community Guidelines"
            onPress={() => router.push('/legal/guidelines')}
          />
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}
