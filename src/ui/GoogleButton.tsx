import { Button } from './Button';
import { GoogleIcon } from './icons/GoogleIcon';

/**
 * Google sign in stays disabled until the backend exposes /auth/login/google.
 * A button that silently does nothing is worse than one that shows it is not
 * ready, so the disabled state is deliberate rather than an oversight.
 */
export function GoogleButton({
  label = 'Continue with Google',
  onPress,
  disabled = true,
}: {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      label={label}
      variant="secondary"
      onPress={onPress}
      disabled={disabled}
      leadingIcon={<GoogleIcon size={18} />}
    />
  );
}
