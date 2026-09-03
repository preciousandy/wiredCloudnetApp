import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BackButton, ConfirmDialog, ListGroup, ListRow, Screen, Switch, Text, toast } from '@/ui';
import { usePreferences } from '@/store/preferences';
import { useSession } from '@/store/session';

export default function Settings() {
  const prefs = usePreferences();
  const signOut = useSession((s) => s.signOut);
  const queryClient = useQueryClient();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!prefs.hydrated) void prefs.hydrate();
  }, [prefs]);

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <ListGroup title="Playback">
          <ListRow
            first
            icon="play-forward-outline"
            label="Autoplay next"
            description="Play the next item automatically"
            right={
              <Switch
                value={prefs.autoplayNext}
                onChange={(v) => prefs.set('autoplayNext', v)}
                accessibilityLabel="Autoplay next"
              />
            }
          />
          <ListRow
            icon="cellular-outline"
            label="Data saver"
            description="Lower quality on mobile data"
            right={
              <Switch
                value={prefs.dataSaver}
                onChange={(v) => prefs.set('dataSaver', v)}
                accessibilityLabel="Data saver"
              />
            }
          />
          <ListRow
            icon="text-outline"
            label="Captions by default"
            right={
              <Switch
                value={prefs.captionsByDefault}
                onChange={(v) => prefs.set('captionsByDefault', v)}
                accessibilityLabel="Captions by default"
              />
            }
          />
          <ListRow
            icon="wifi-outline"
            label="Download over Wi-Fi only"
            right={
              <Switch
                value={prefs.downloadOverWifiOnly}
                onChange={(v) => prefs.set('downloadOverWifiOnly', v)}
                accessibilityLabel="Download over Wi-Fi only"
              />
            }
          />
        </ListGroup>

        <ListGroup title="Notifications">
          <ListRow
            first
            icon="videocam-outline"
            label="New uploads"
            description="From creators you follow"
            right={
              <Switch
                value={prefs.notifyNewUploads}
                onChange={(v) => prefs.set('notifyNewUploads', v)}
                accessibilityLabel="New upload notifications"
              />
            }
          />
          <ListRow
            icon="wallet-outline"
            label="Wallet activity"
            description="Top ups, purchases and refunds"
            right={
              <Switch
                value={prefs.notifyWallet}
                onChange={(v) => prefs.set('notifyWallet', v)}
                accessibilityLabel="Wallet notifications"
              />
            }
          />
          <ListRow
            icon="pricetag-outline"
            label="Offers and promotions"
            right={
              <Switch
                value={prefs.notifyPromotions}
                onChange={(v) => prefs.set('notifyPromotions', v)}
                accessibilityLabel="Promotional notifications"
              />
            }
          />
        </ListGroup>

        <ListGroup title="Security">
          <ListRow
            first
            icon="key-outline"
            label="Change password"
            onPress={() => router.push('/settings/change-password')}
          />
          <ListRow
            icon="shield-checkmark-outline"
            label="Two-factor authentication"
            description="Required for withdrawals"
            value={prefs.twoFactorEnabled ? 'On' : 'Off'}
            onPress={() => router.push('/settings/2fa')}
          />
          <ListRow icon="phone-portrait-outline" label="Trusted devices" value="1" />
          <ListRow
            icon="ban-outline"
            label="Blocked accounts"
            onPress={() => router.push('/settings/blocked')}
          />
        </ListGroup>

        <ListGroup title="About">
          <ListRow
            first
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push('/legal/terms')}
          />
          <ListRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy')}
          />
          <ListRow
            icon="people-outline"
            label="Community Guidelines"
            onPress={() => router.push('/legal/guidelines')}
          />
          <ListRow
            icon="help-circle-outline"
            label="Help and support"
            onPress={() => router.push('/help')}
          />
          <ListRow icon="information-circle-outline" label="Version" value="0.1.0" />
        </ListGroup>

        <ListGroup>
          <ListRow
            first
            icon="refresh-outline"
            label="Reset preferences"
            onPress={() => {
              prefs.resetAll();
              toast.success('Preferences reset');
            }}
          />
          <ListRow
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={() => setConfirmSignOut(true)}
          />
          <ListRow
            icon="trash-outline"
            label="Delete account"
            danger
            onPress={() => router.push('/settings/delete-account')}
          />
        </ListGroup>
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        tone="danger"
        title="Sign out?"
        message="You will need your password to sign back in. Anything you own stays on your account."
        confirmLabel="Sign out"
        loading={signingOut}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={async () => {
          setSigningOut(true);
          try {
            await signOut();
            queryClient.clear();
            toast.success('Signed out');
            setSigningOut(false);
            setConfirmSignOut(false);
            router.replace('/(auth)/sign-in');
          } catch {
            setSigningOut(false);
            setConfirmSignOut(false);
            router.replace('/(auth)/sign-in');
          }
        }}
      />
    </Screen>
  );
}
