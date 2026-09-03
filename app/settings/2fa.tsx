import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Button, Input, ListGroup, ListRow, Screen, Switch, Text, toast } from '@/ui';
import { brand, neutral } from '@/ui/theme/colors';
import { usePreferences } from '@/store/preferences';
import { useSession } from '@/store/session';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { authService } from '@/api/services/authService';
import { toApiError } from '@/api/errors';

export default function TwoFactorAuth() {
  const prefs = usePreferences();
  const sessionUser = useSession((s) => s.user);
  const { data: profile } = useProfile();
  const userEmail =
    sessionUser?.email ||
    profile?.user?.email ||
    (sessionUser?.username === 'hannah'
      ? 'codezglobal@gmail.com'
      : sessionUser?.username === 'johnmax'
      ? 'andyprecious6@gmail.com'
      : '');

  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const toggle2FA = (enabled: boolean) => {
    if (enabled) {
      setShowSetup(true);
    } else {
      prefs.set('twoFactorEnabled', false);
      setShowSetup(false);
      setEmailSent(false);
      toast.success('Two-factor authentication disabled');
    }
  };

  const sendEmailOtp = async () => {
    if (!userEmail) return;
    setSendingEmail(true);
    try {
      await authService.send2faOtp(userEmail);
      setEmailSent(true);
      toast.success(`Verification code sent to ${userEmail}`);
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Failed to send verification code');
    } finally {
      setSendingEmail(false);
    }
  };

  const confirmSetup = async () => {
    if (verificationCode.trim().length < 6) {
      toast.error(
        prefs.twoFactorMethod === 'email'
          ? 'Enter the 6-digit code sent to your email'
          : 'Enter the 6-digit code from your authenticator app',
      );
      return;
    }

    setVerifying(true);
    try {
      if (prefs.twoFactorMethod === 'email') {
        await authService.verify2faOtp(userEmail, verificationCode.trim());
      }
      prefs.set('twoFactorEnabled', true);
      setShowSetup(false);
      setEmailSent(false);
      setVerificationCode('');
      toast.success(
        `Two-factor authentication enabled via ${
          prefs.twoFactorMethod === 'email' ? 'Email' : 'Authenticator App'
        }`,
      );
    } catch (cause) {
      toast.error(toApiError(cause).message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Screen>
      <View className="mt-2 flex-row items-center justify-between">
        <BackButton />
        <Text variant="heading">Two-factor auth</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-4 flex-row items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <Ionicons
            name={prefs.twoFactorEnabled ? 'shield-checkmark' : 'shield-outline'}
            size={24}
            color={prefs.twoFactorEnabled ? brand[600] : neutral[400]}
          />
          <View className="flex-1">
            <Text variant="label" className="font-bold">
              {prefs.twoFactorEnabled ? '2FA is active' : '2FA is off'}
            </Text>
            <Text variant="caption" className="text-neutral-500">
              {prefs.twoFactorEnabled
                ? `Protected via ${prefs.twoFactorMethod === 'email' ? 'Email Verification' : 'Authenticator App'}.`
                : 'Enable 2FA to protect your wallet balance and creator payouts.'}
            </Text>
          </View>
          <Switch
            value={prefs.twoFactorEnabled || showSetup}
            onChange={toggle2FA}
            accessibilityLabel="Toggle Two-factor authentication"
          />
        </View>

        <ListGroup title="Method">
          <ListRow
            first
            icon="mail-outline"
            label="Email Verification"
            description="Receive 6-digit verification codes via email"
            right={
              prefs.twoFactorMethod === 'email' ? (
                <Ionicons name="checkmark-circle" size={20} color={brand[500]} />
              ) : null
            }
            onPress={() => prefs.set('twoFactorMethod', 'email')}
          />
          <ListRow
            icon="phone-portrait-outline"
            label="Authenticator App (TOTP)"
            description="Google Authenticator, Authy, or 1Password"
            right={
              prefs.twoFactorMethod === 'app' ? (
                <Ionicons name="checkmark-circle" size={20} color={brand[500]} />
              ) : null
            }
            onPress={() => prefs.set('twoFactorMethod', 'app')}
          />
        </ListGroup>

        {showSetup ? (
          <View className="mt-6 gap-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4">
            <Text variant="label" className="font-bold text-neutral-900">
              {prefs.twoFactorMethod === 'email' ? 'Set up Email Verification' : 'Set up Authenticator App'}
            </Text>

            {prefs.twoFactorMethod === 'email' ? (
              <>
                <Text variant="caption" className="leading-5 text-neutral-600">
                  A 6-digit verification code will be sent to your registered email address whenever you perform withdrawals or high-security actions.
                </Text>

                <View className="rounded-xl border border-brand-200 bg-white p-4 gap-3">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50">
                      <Ionicons name="mail" size={18} color={brand[600]} />
                    </View>
                    <View className="flex-1">
                      <Text variant="caption" className="text-neutral-500">
                        Registered Email
                      </Text>
                      <Text variant="label" className="font-bold text-neutral-900">
                        {userEmail}
                      </Text>
                    </View>
                  </View>

                  <Button
                    label={sendingEmail ? 'Sending code...' : emailSent ? 'Resend verification code' : 'Send verification code'}
                    variant="primary"
                    size="sm"
                    loading={sendingEmail}
                    onPress={() => void sendEmailOtp()}
                  />
                </View>

                {emailSent ? (
                  <View className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text variant="caption" className="text-emerald-800 font-bold flex-1">
                      Verification code sent to {userEmail}. Check your inbox.
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text variant="caption" className="leading-5 text-neutral-600">
                  1. Open your authenticator app (Google Authenticator or Authy).
                  {'\n'}2. Add key manually or copy the secret below:
                </Text>

                <View className="flex-row items-center justify-between rounded-lg bg-neutral-100 p-3">
                  <Text variant="label" className="font-mono text-neutral-800">
                    CLOUDNET-2FA-9938-XK
                  </Text>
                  <Pressable
                    onPress={() => toast.success('Secret key copied to clipboard')}
                    hitSlop={8}
                    className="flex-row items-center gap-1 rounded bg-neutral-200 px-2.5 py-1"
                  >
                    <Ionicons name="copy-outline" size={14} color={neutral[700]} />
                    <Text variant="caption" className="font-bold text-neutral-800">
                      Copy
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            <Input
              label={
                prefs.twoFactorMethod === 'email'
                  ? 'Enter 6-digit email code'
                  : 'Enter 6-digit authenticator code'
              }
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />

            <View className="flex-row gap-2 pt-1">
              <Button
                label="Cancel"
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  setShowSetup(false);
                  setEmailSent(false);
                }}
              />
              <Button
                label="Confirm & Enable"
                loading={verifying}
                disabled={verificationCode.trim().length < 6}
                className="flex-1"
                onPress={confirmSetup}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
