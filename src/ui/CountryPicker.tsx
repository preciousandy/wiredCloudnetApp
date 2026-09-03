import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { brand, neutral } from './theme/colors';
import { COUNTRIES, searchCountries, type Country } from '@/lib/countries';

export interface CountryPickerProps {
  visible: boolean;
  selectedIso: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export function CountryPicker({
  visible,
  selectedIso,
  onSelect,
  onClose,
}: CountryPickerProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => (query ? searchCountries(query) : COUNTRIES), [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-4">
          <Text variant="heading">Select country</Text>
          <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={neutral[600]} />
          </Pressable>
        </View>

        <View className="px-4 py-3">
          <View className="h-11 flex-row items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3">
            <Ionicons name="search" size={17} color={neutral[400]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={neutral[400]}
              autoCorrect={false}
              autoCapitalize="none"
              className="flex-1 text-[15px] text-neutral-900"
            />
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.iso}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text variant="body" className="text-neutral-500">
                No country matches “{query}”.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const selected = item.iso === selectedIso;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  close();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${
                  selected ? 'bg-brand-50' : ''
                }`}
              >
                <Text className="text-[22px]">{item.flag}</Text>
                <Text variant="body" className="flex-1">
                  {item.name}
                </Text>
                <Text variant="label" className="text-neutral-500">
                  {item.dial}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark" size={18} color={brand[500]} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}
