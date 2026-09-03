import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { brand, neutral } from './theme/colors';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  /** Explains the choice itself, shown once at the top of the sheet. */
  sheetIntro?: string;
}

/**
 * Dropdown as a sheet rather than an inline expander.
 *
 * Inline dropdowns push the rest of a long form around and get clipped inside
 * scroll views. A sheet always has room and never moves the field the user just
 * tapped.
 *
 * The sheet is anchored to the true bottom of the screen, safe area included.
 * A fixed bottom padding leaves a white gap under the home indicator on tall
 * phones, which reads as a rendering bug rather than a design choice.
 */
export function Select({
  label,
  placeholder = 'Select',
  value,
  options,
  onChange,
  error,
  hint,
  sheetIntro,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <View className="w-full">
      {label ? (
        <Text variant="label" className="mb-1 ml-1">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Select'}. Currently ${selected?.label ?? 'nothing selected'}`}
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${
          error ? 'border-danger bg-danger/5' : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        <View className="flex-1 flex-row items-center gap-2">
          {selected?.icon ? (
            <Ionicons name={selected.icon} size={16} color={neutral[500]} />
          ) : null}
          <Text variant="body" className={selected ? 'text-neutral-900' : 'text-neutral-400'}>
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={neutral[400]} />
      </Pressable>

      {error ? (
        <Text variant="caption" className="mt-1 ml-1 text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1 ml-1">
          {hint}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end">
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />

          <View
            className="max-h-[78%] rounded-t-lg bg-white"
            style={{ paddingBottom: insets.bottom + 10 }}
          >
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-10 rounded-full bg-neutral-300" />
            </View>

            <View className="flex-row items-start justify-between px-5 pb-3 pt-1">
              <View className="flex-1 pr-3">
                <Text variant="heading">{label ?? 'Select'}</Text>
                {sheetIntro ? (
                  <Text variant="caption" className="mt-1 text-neutral-500">
                    {sheetIntro}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-100"
              >
                <Ionicons name="close" size={18} color={neutral[600]} />
              </Pressable>
            </View>

            <View className="h-px bg-neutral-100" />

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 6 }}
              ItemSeparatorComponent={() => <View className="ml-4 h-px bg-neutral-100" />}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`flex-row items-center gap-3 px-4 py-4 ${active ? 'bg-brand-50' : ''}`}
                  >
                    {item.icon ? (
                      <View
                        className={`h-9 w-9 items-center justify-center rounded-lg ${
                          active ? 'bg-brand-500' : 'bg-neutral-100'
                        }`}
                      >
                        <Ionicons
                          name={item.icon}
                          size={17}
                          color={active ? '#FFFFFF' : neutral[500]}
                        />
                      </View>
                    ) : null}

                    <View className="flex-1">
                      <Text variant="body" className={active ? 'font-bold' : ''}>
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text variant="caption" className="mt-0.5 leading-5 text-neutral-500">
                          {item.description}
                        </Text>
                      ) : null}
                    </View>

                    {active ? <Ionicons name="checkmark" size={18} color={brand[500]} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
