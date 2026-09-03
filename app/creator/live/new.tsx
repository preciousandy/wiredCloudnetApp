import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  BackButton,
  Banner,
  Button,
  Checkbox,
  Input,
  ListRow,
  Screen,
  SegmentedTabs,
  Switch,
  Text,
  toast,
  type SegmentOption,
} from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { formatMoney, parseMoneyInput } from '@/lib/money';
import { liveService } from '@/api/services';
import { toApiError, type ApiError } from '@/api/errors';
import { useMediaUpload } from '@/features/cloudit/hooks/useMediaUpload';
import { MediaPicker } from '@/features/cloudit/components/MediaPicker';
import { ScheduleField } from '@/features/live/components/ScheduleField';
import { AmountField } from '@/features/wallet/components/AmountField';

type Access = 'free' | 'ticketed';

const ACCESS: readonly SegmentOption<Access>[] = [
  { value: 'free', label: 'Free', icon: 'people-outline' },
  { value: 'ticketed', label: 'Ticketed', icon: 'ticket-outline' },
];

const PLATFORM_SHARE = 0.3;

/**
 * Scheduling a live event.
 *
 * One screen rather than the four step wizard CloudIt uses, and on purpose: a
 * live event is six decisions, and a creator setting one up is usually doing it
 * because something is happening soon. Splitting six fields across four screens
 * would add taps and no clarity.
 *
 * Everything here is changeable up until the event starts, except the start time
 * once tickets have sold. That constraint lives on the server.
 */
export default function ScheduleLiveEvent() {
  const queryClient = useQueryClient();
  const poster = useMediaUpload('thumbnail');

  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [access, setAccess] = useState<Access>('free');
  const [price, setPrice] = useState('');
  const [replay, setReplay] = useState(true);
  const [chat, setChat] = useState(true);
  const [rights, setRights] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const ticketPrice = (() => {
    if (access === 'free') return null;
    try {
      return parseMoneyInput(price, 'CP');
    } catch {
      return null;
    }
  })();

  const errors: Record<string, string> = {};
  if (poster.upload?.status === 'uploading') errors.poster = 'Wait for the cover to finish uploading.';
  if (title.trim().length < 1) errors.title = 'Give the event a title.';
  if (!startsAt) errors.startsAt = 'Choose when it starts.';
  if (access === 'ticketed' && (!ticketPrice || ticketPrice.minor <= 0)) {
    errors.price = 'Set a ticket price.';
  }
  if (!rights) errors.rights = 'Confirm you have the rights to stream this.';

  const canSubmit = Object.keys(errors).length === 0;

  const pickPoster = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error('CloudNet needs access to your library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    const asset = result.assets?.[0];
    if (!asset) return;

    setPosterPreview(asset.uri);
    await poster.start({
      uri: asset.uri,
      name: asset.fileName ?? 'cover.jpg',
      sizeBytes: asset.fileSize ?? 2 * 1024 * 1024,
      contentType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const schedule = useMutation({
    mutationFn: () =>
      liveService.schedule({
        title: title.trim(),
        description: description.trim() || 'Live stream session on CloudNet',
        posterAssetId: poster.assetId || 'default_live_cover',
        startsAt: startsAt || new Date(Date.now() + 60_000).toISOString(),
        ticketPrice,
        replayAvailable: replay,
        chatEnabled: chat,
        rightsConfirmed: true,
      }),
    onSuccess: (event) => {
      void queryClient.invalidateQueries({ queryKey: ['creator', 'live'] });
      toast.success('Event scheduled');
      router.replace(`/creator/live/${event.id}/greenroom`);
    },
    onError: (cause) => setError(toApiError(cause)),
  });

  const submit = () => {
    setShowErrors(true);
    setError(null);
    if (!canSubmit) return;
    schedule.mutate();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center gap-3 pb-3 pt-2">
          <BackButton />
          <Text variant="heading" className="flex-1">
            Schedule a live event
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24, gap: 20 }}
        >
          {error ? <Banner tone="error" message={error.message} /> : null}

          <View className="flex-row items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 p-3.5">
            <Ionicons name="bulb-outline" size={16} color={brand[500]} />
            <Text variant="caption" className="flex-1 leading-5 text-neutral-700">
              Your camera opens inside CloudNet when you go live. No other app,
              no stream key to copy. Set this up now and come back when you are
              ready to start.
            </Text>
          </View>

          <View>
            <Text variant="label" className="mb-2 ml-1">
              Cover image
            </Text>
            <MediaPicker
              title="Add a cover"
              hint="16:9. This is what people see before you start."
              icon="image-outline"
              aspect="wide"
              previewUri={posterPreview}
              upload={poster.upload}
              error={showErrors ? errors.poster : undefined}
              onPick={() => void pickPoster()}
              onClear={() => {
                setPosterPreview(null);
                void poster.cancel();
              }}
            />
          </View>

          <Input
            label="Event title"
            placeholder="Owambe: The Live Session"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            error={showErrors ? errors.title : undefined}
          />

          <Input
            label="What is it about"
            placeholder="A full night of highlife, streamed from Lagos."
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            error={showErrors ? errors.description : undefined}
          />

          <ScheduleField
            value={startsAt}
            onChange={setStartsAt}
            error={showErrors ? errors.startsAt : undefined}
          />

          <View>
            <Text variant="label" className="mb-2 ml-1">
              Access
            </Text>
            <SegmentedTabs options={ACCESS} value={access} onChange={setAccess} />
            <Text variant="caption" className="mt-1.5 ml-1 text-neutral-400">
              {access === 'free'
                ? 'Anyone can watch. Good for building an audience before you charge.'
                : 'Viewers buy a ticket from their wallet before they can join.'}
            </Text>
          </View>

          {access === 'ticketed' ? (
            <View className="gap-3">
              <AmountField
                value={price}
                onChangeText={setPrice}
                error={showErrors ? errors.price : undefined}
              />

              {ticketPrice && ticketPrice.minor > 0 ? (
                <View className="gap-2 rounded-lg bg-neutral-50 p-4">
                  <Row label="Viewer pays" value={formatMoney(ticketPrice, { compactWhole: true })} />
                  <Row
                    label="CloudNet commission"
                    value={formatMoney(
                      {
                        minor: Math.round(ticketPrice.minor * PLATFORM_SHARE),
                        currency: ticketPrice.currency,
                      },
                      { compactWhole: true },
                    )}
                  />
                  <View className="my-1 h-px bg-neutral-200" />
                  <Row
                    bold
                    label="You earn per ticket"
                    value={formatMoney(
                      {
                        minor: ticketPrice.minor - Math.round(ticketPrice.minor * PLATFORM_SHARE),
                        currency: ticketPrice.currency,
                      },
                      { compactWhole: true },
                    )}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="overflow-hidden rounded-lg border border-neutral-200">
            <ListRow
              first
              label="Keep the replay"
              description="The recording stays available after the event ends"
              right={
                <Switch
                  value={replay}
                  onChange={setReplay}
                  accessibilityLabel="Keep the replay after the event"
                />
              }
            />
            <View className="h-px bg-neutral-100" />
            <ListRow
              label="Live chat"
              description="Viewers can talk to you while you stream"
              right={
                <Switch
                  value={chat}
                  onChange={setChat}
                  accessibilityLabel="Enable live chat"
                />
              }
            />
          </View>

          <Checkbox
            checked={rights}
            onChange={setRights}
            error={showErrors ? errors.rights : undefined}
            label={
              <Text variant="label">
                I have the rights to stream everything in this event, including
                any music, and it follows the{' '}
                <Text variant="label" className="font-bold text-brand-500">
                  Community Guidelines
                </Text>
                .
              </Text>
            }
          />

          <View className="flex-row items-start gap-2 rounded-lg bg-neutral-50 p-3">
            <Ionicons name="information-circle-outline" size={15} color={neutral[400]} />
            <Text variant="caption" className="flex-1 leading-5">
              You can change any of this until the event starts. Once tickets
              have sold, the start time is fixed.
            </Text>
          </View>
        </ScrollView>

        <View className="gap-2 pb-4 pt-3">
          {!canSubmit ? (
            <Text variant="caption" className="text-center text-neutral-400">
              {Object.values(errors)[0]}
            </Text>
          ) : null}
          <Button
            label="Schedule event"
            loading={schedule.isPending}
            disabled={!canSubmit}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className={bold ? 'font-bold text-neutral-900' : 'text-neutral-500'}>
        {label}
      </Text>
      <Text variant={bold ? 'label' : 'caption'} className={bold ? 'font-bold' : ''}>
        {value}
      </Text>
    </View>
  );
}
