/** All auth copy in one place, so tone stays consistent and localisation is possible. */
export const authCopy = {
  signUp: {
    title: 'Create your account',
    subtitle: 'Stream, buy and upload on CloudNet.',
    phoneOrEmail: 'Use phone or email',
    google: 'Continue with Google',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    legal:
      "By continuing you agree to CloudNet's Terms of Service and confirm you have read our Privacy Policy.",
  },
  signIn: {
    title: 'Welcome back',
    subtitle: 'Sign in to your CloudNet account.',
    identity: 'Email or phone',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign in',
    noAccount: "Don't have an account?",
    create: 'Sign up',
  },
  method: {
    title: 'Enter email or phone number',
    subtitle: 'We will send you a 4-digit code to confirm it is you.',
    submit: 'Send code',
  },
  verify: {
    title: (type: 'email' | 'phone') =>
      type === 'phone' ? 'Verify your number' : 'Verify your email',
    sentTo: 'We sent a 4-digit code to',
    submit: 'Verify',
    resend: 'Resend code',
    noCode: "Didn't get a code?",
    wrongIdentity: (type: 'email' | 'phone') =>
      type === 'phone' ? 'Wrong number?' : 'Wrong email?',
  },
  setPassword: {
    title: 'Set your password',
    subtitle: 'Pick something you will remember but others will not guess.',
    password: 'Password',
    confirm: 'Confirm password',
    mismatch: 'Passwords do not match.',
    submit: 'Continue',
  },
  setUsername: {
    title: 'Choose a username',
    subtitle: 'This is how people will find you on CloudNet.',
    label: 'Username',
    submit: 'Finish',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: 'Enter your email or phone number and we will send you a code.',
    submit: 'Send code',
    newPassword: 'New password',
    done: 'Password updated. You can sign in now.',
  },
} as const;
