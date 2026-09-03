import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Text } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Half hour slots across the day. */
const SLOTS = Array.from({ length: 48 }, (_, i) => ({
  hour: Math.floor(i / 2),
  minute: i % 2 === 0 ? 0 : 30,
}));

function labelFor(date: Date, now: Date): string {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function timeLabel(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')}${suffix}`;
}

export interface ScheduleFieldProps {
  /** ISO string, or null when nothing is chosen yet. */
  value: string | null;
  onChange: (iso: string) => void;
  error?: string;
}

/**
 * When the event starts.
 *
 * A hand rolled picker rather than a native date dialog, for one reason: the
 * native pickers on Android and iOS look and behave nothing like each other, and
 * this is the screen where a creator commits to a time they will have to show up
 * for. Two weeks of days and half hour slots covers essentially every real
 * scheduling case and keeps the choice inside CloudNet's own design.
 *
 * Past slots are filtered rather than shown greyed out, so nothing selectable is
 * ever invalid.
 */
export function ScheduleField({ value, onChange, error }: ScheduleFieldProps) {
  const [open, setOpen] = useState(false);
  const now = useMemo(() => new Date(), [open]);

  const selected = value ? new Date(value) : null;
  const [draftDay, setDraftDay] = useState<Date>(() => selected ?? new Date());

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
      }),
    [now],
  );

  // Only slots still ahead of us. A creator cannot start an event in the past.
  const slots = useMemo(() => {
    const isToday = draftDay.toDateString() === now.toDateString();
    return SLOTS.filter(({ hour, minute }) => {
      if (!isToday) return true;
      const candidate = new Date(draftDay);
      candidate.setHours(hour, minute, 0, 0);
      // Fifteen minutes of headroom: nobody can set up a broadcast in ten.
      return candidate.getTime() > now.getTime() + 15 * 60_000;
    });
  }, [draftDay, now]);

  const commit = (hour: number, minute: number) => {
    const next = new Date(draftDay);
    next.setHours(hour, minute, 0, 0);
    onChange(next.toISOString());
    setOpen(false);
  };

  return (
    <View className="w-full">
      <Text variant="label" className="mb-1 ml-1">
        Starts
      </Text>

      <Pressable
        onPress={() => {
          setDraftDay(selected ?? new Date());
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Choose when the event starts"
        className={`h-12 flex-row items-center justify-between rounded-lg border px-3 ${
          error ? 'border-danger bg-danger/5' : 'border-neutral-200 bg-neutral-50'
        }`}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={16} color={neutral[500]} />
          <Text variant="body" className={selected ? 'text-neutral-900' : 'text-neutral-400'}>
            {selected
              ? `${labelFor(selected, now)}, ${timeLabel(selected.getHours(), selected.getMinutes())}`
              : 'Pick a date and time'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={17} color={neutral[400]} />
      </Pressable>

      <Text variant="caption" className={`mt-1 ml-1 ${error ? 'text-danger' : 'text-neutral-400'}`}>
        {error ?? 'Followers get a reminder an hour before you start.'}
      </Text>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="When does it start?"
        height={0.62}
      >
        <View className="flex-1">
          <Text variant="caption" className="px-5 pb-2 pt-3 text-neutral-500">
            Day
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {days.map((day) => {
              const active = day.toDateString() === draftDay.toDateString();
              return (
                <Pressable
                  key={day.toISOString()}
                  onPress={() => setDraftDay(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`h-16 w-20 items-center justify-center rounded-lg border ${
                    active ? 'border-brand-500 bg-brand-50' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <Text variant="caption" className={active ? 'text-brand-600' : 'text-neutral-400'}>
                    {DAYS[day.getDay()]}
                  </Text>
                  <Text variant="body" className={`font-bold ${active ? 'text-brand-600' : ''}`}>
                    {day.getDate()}
                  </Text>
                  <Text variant="caption" className={active ? 'text-brand-600' : 'text-neutral-400'}>
                    {MONTHS[day.getMonth()]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text variant="caption" className="px-5 pb-2 pt-4 text-neutral-500">
            Time
          </Text>

          {slots.length === 0 ? (
            <Text variant="body" className="px-5 text-neutral-400">
              No slots left today. Pick tomorrow.
            </Text>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {slots.map(({ hour, minute }) => {
                const active =
                  selected != null &&
                  selected.toDateString() === draftDay.toDateString() &&
                  selected.getHours() === hour &&
                  selected.getMinutes() === minute;
                return (
                  <Pressable
                    key={`${hour}-${minute}`}
                    onPress={() => commit(hour, minute)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`h-10 w-[22%] items-center justify-center rounded-lg border ${
                      active ? 'border-brand-500 bg-brand-500' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <Text
                      variant="caption"
                      className={active ? 'font-bold text-white' : 'text-neutral-700'}
                    >
                      {timeLabel(hour, minute)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}

export { labelFor as formatEventDay, timeLabel as formatEventTime };
