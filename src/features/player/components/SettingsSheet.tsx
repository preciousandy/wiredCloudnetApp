import { ScrollView, View } from 'react-native';
import type { VideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, ListRow, Text } from '@/ui';
import { brand } from '@/ui/theme/colors';
import { usePreferences } from '@/store/preferences';

export interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  player: VideoPlayer;
  /** Re-read from the player each time the sheet opens, tracks arrive late. */
  refreshKey: number;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Quality, speed, subtitles and audio.
 *
 * Driven by what the player reports the stream actually contains rather than by
 * what the API claimed. A quality option that does not exist in the manifest is
 * worse than not offering the choice.
 */
export function SettingsSheet({ visible, onClose, player, refreshKey }: SettingsSheetProps) {
  const dataSaver = usePreferences((s) => s.dataSaver);

  // Reading native arrays can throw if the player was released mid-close.
  const read = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  const videoTracks = read(() => player.availableVideoTracks ?? [], []);
  const subtitleTracks = read(() => player.availableSubtitleTracks ?? [], []);
  const audioTracks = read(() => player.availableAudioTracks ?? [], []);

  const currentVideo = read(() => player.videoTrack, null);
  const currentSubtitle = read(() => player.subtitleTrack, null);
  const currentAudio = read(() => player.audioTrack, null);
  const currentRate = read(() => player.playbackRate, 1);

  const set = (apply: () => void) => {
    try {
      apply();
    } catch {
      /* ignore, the sheet stays open and nothing changes */
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Playback" height={0.7}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} key={refreshKey}>
        {/**
          * Quality is reported, not chosen.
          *
          * expo-video exposes `videoTrack` as read only: the player picks a rung
          * off the HLS ladder from the measured bandwidth and there is no
          * supported way to pin it from JS. A picker here would set state and
          * change nothing, which is worse than not offering it, so we show what
          * the stream contains and which rung is playing.
          *
          * If pinning becomes a real requirement, it belongs in the manifest:
          * the backend serves a capped variant playlist for data saver users.
          */}
        <Section title="Quality">
          {dataSaver ? (
            <View className="mb-2 flex-row items-center gap-2 rounded-lg bg-brand-50 px-3 py-2">
              <Ionicons name="cellular-outline" size={14} color={brand[600]} />
              <Text variant="caption" className="flex-1 text-brand-700">
                Data saver is on, so this stream starts at a lower quality and
                climbs only if your connection holds.
              </Text>
            </View>
          ) : null}

          {videoTracks.length > 0 ? (
            <>
              {videoTracks.map((track, index) => {
                const active = currentVideo?.id === track.id;
                return (
                  <View
                    key={`${track.id || index}`}
                    className="flex-row items-center gap-2 py-2"
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'ellipse-outline'}
                      size={16}
                      color={active ? brand[500] : '#D4D4D8'}
                    />
                    <Text variant="body" className={`flex-1 ${active ? 'font-bold' : ''}`}>
                      {track.size?.height ? `${track.size.height}p` : `Track ${index + 1}`}
                    </Text>
                    {track.bitrate ? (
                      <Text variant="caption" className="text-neutral-400">
                        {Math.round(track.bitrate / 1000)} kbps
                      </Text>
                    ) : null}
                  </View>
                );
              })}
              <Text variant="caption" className="mt-1 text-neutral-400">
                Quality follows your connection automatically.
              </Text>
            </>
          ) : (
            <Empty label="This stream has one quality only" />
          )}
        </Section>

        <Section title="Speed">
          {SPEEDS.map((speed) => (
            <Option
              key={speed}
              label={speed === 1 ? 'Normal' : `${speed}x`}
              selected={Math.abs(currentRate - speed) < 0.01}
              onPress={() => set(() => (player.playbackRate = speed))}
            />
          ))}
        </Section>

        <Section title="Subtitles">
          <Option
            label="Off"
            selected={currentSubtitle === null}
            onPress={() => set(() => (player.subtitleTrack = null))}
          />
          {subtitleTracks.map((track, index) => (
            <Option
              key={`${track.id ?? index}`}
              label={track.label ?? track.language ?? `Track ${index + 1}`}
              selected={currentSubtitle?.id === track.id}
              onPress={() => set(() => (player.subtitleTrack = track))}
            />
          ))}
          {subtitleTracks.length === 0 ? <Empty label="No subtitles on this title" /> : null}
        </Section>

        {audioTracks.length > 1 ? (
          <Section title="Audio">
            {audioTracks.map((track, index) => (
              <Option
                key={`${track.id ?? index}`}
                label={track.label ?? track.language ?? `Track ${index + 1}`}
                selected={currentAudio?.id === track.id}
                onPress={() => set(() => (player.audioTrack = track))}
              />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text variant="caption" className="mb-2 ml-1 uppercase tracking-widest">
        {title}
      </Text>
      <View className="overflow-hidden rounded-lg border border-neutral-200">{children}</View>
    </View>
  );
}

function Option({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <ListRow
      label={label}
      description={description}
      onPress={onPress}
      right={
        selected ? (
          <Ionicons name="checkmark" size={18} color={brand[500]} />
        ) : (
          <View className="w-[18px]" />
        )
      }
    />
  );
}

function Empty({ label }: { label: string }) {
  return (
    <View className="px-4 py-3.5">
      <Text variant="caption" className="text-neutral-400">
        {label}
      </Text>
    </View>
  );
}
