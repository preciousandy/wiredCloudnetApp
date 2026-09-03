import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/ui';
import type { BroadcastDeviceState, BroadcastState } from '../broadcast';

export interface CameraStageProps {
  state: BroadcastState;
  isSupported: boolean;
  devices: BroadcastDeviceState;
  posterUrl?: string;
  onFlip: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
}

/**
 * Where the camera preview goes.
 *
 * Until a development build exists there is no native camera to render, so this
 * shows the event cover behind a clear notice rather than a black rectangle. The
 * device controls are wired to the real broadcaster either way, which is the
 * point: the layout, the states and the toggles are all being exercised now, and
 * the only thing that changes later is what fills the frame.
 */
export function CameraStage({
  state,
  isSupported,
  devices,
  posterUrl,
  onFlip,
  onToggleCamera,
  onToggleMicrophone,
}: CameraStageProps) {
  return (
    <View className="flex-1">
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
          blurRadius={devices.cameraEnabled ? 12 : 32}
        />
      ) : null}

      <View
        className="absolute inset-0"
        style={{ backgroundColor: devices.cameraEnabled ? 'rgba(9,9,11,0.55)' : 'rgba(9,9,11,0.85)' }}
      />

      <View className="flex-1 items-center justify-center gap-3 px-10">
        {!devices.cameraEnabled ? (
          <>
            <Ionicons name="videocam-off-outline" size={38} color="rgba(255,255,255,0.7)" />
            <Text variant="body" className="text-center text-white/70">
              Camera off
            </Text>
          </>
        ) : !isSupported ? (
          <>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="camera-outline" size={28} color="rgba(255,255,255,0.85)" />
            </View>
            <Text variant="label" className="text-center font-bold text-white">
              Camera preview
            </Text>
            <Text variant="caption" className="text-center leading-5 text-white/55">
              Your camera appears here once CloudNet is installed as a full app
              rather than run through Expo Go. Everything else on this screen is
              live and working.
            </Text>
          </>
        ) : (
          <Ionicons name="videocam-outline" size={38} color="rgba(255,255,255,0.5)" />
        )}
      </View>

      {/* Device controls sit on the stage, not in the sheet below, because they
          are about what the camera is doing rather than about the event. */}
      <View className="absolute bottom-6 left-0 right-0 flex-row items-center justify-center gap-4">
        <Control
          icon={devices.microphoneEnabled ? 'mic' : 'mic-off'}
          active={devices.microphoneEnabled}
          label={devices.microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          onPress={onToggleMicrophone}
        />
        <Control
          icon={devices.cameraEnabled ? 'videocam' : 'videocam-off'}
          active={devices.cameraEnabled}
          label={devices.cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          onPress={onToggleCamera}
        />
        <Control
          icon="camera-reverse-outline"
          active
          label="Switch camera"
          onPress={onFlip}
          disabled={!devices.cameraEnabled}
        />
      </View>

      {state === 'reconnecting' ? (
        <View className="absolute left-0 right-0 top-0 items-center pt-24">
          <View className="flex-row items-center gap-2 rounded-lg bg-warning px-3 py-2">
            <Ionicons name="wifi-outline" size={14} color="#FFFFFF" />
            <Text variant="caption" className="font-bold text-white">
              Reconnecting
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Control({
  icon,
  active,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={`h-12 w-12 items-center justify-center rounded-full ${
        active ? 'bg-white/15' : 'bg-danger'
      }`}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={21} color="#FFFFFF" />
    </Pressable>
  );
}
