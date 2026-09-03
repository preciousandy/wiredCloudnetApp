/**
 * Legal and help copy.
 *
 * Placeholder wording written to be structurally correct rather than legally
 * binding. A lawyer must replace the terms and privacy text before launch;
 * the FAQ is ours to write.
 */
export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    updated: '5 August 2026',
    sections: [
      { heading: 'Using CloudNet', body: 'CloudNet lets you watch, buy and upload video. By using the app you agree to these terms and to our Community Guidelines.' },
      { heading: 'Your account', body: 'You are responsible for keeping your login details private. Tell us immediately if you think someone else has access to your account.' },
      { heading: 'Buying content', body: 'Purchases are made from your CloudNet wallet balance. Access to a title is granted to your account and is not transferable.' },
      { heading: 'Uploading content', body: 'You keep ownership of what you upload. You confirm you have the rights to publish it and grant CloudNet a licence to stream it to viewers.' },
      { heading: 'Payouts', body: 'Creators receive 70 percent of the sale price of their content. Payouts are made to a verified account after review.' },
      { heading: 'Ending your account', body: 'You may delete your account at any time from Settings. Some records are retained where the law requires it.' },
      { heading: 'Placeholder notice', body: 'This wording is a structural placeholder and must be replaced with text prepared by a qualified lawyer before launch.' },
    ],
  },

  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    updated: '5 August 2026',
    sections: [
      { heading: 'What we collect', body: 'Your account details, what you watch, what you buy, and basic device information needed to stream video reliably.' },
      { heading: 'Payment details', body: 'CloudNet never sees or stores your card number. Payments are handled by Flutterwave, a licensed payment provider.' },
      { heading: 'How we use it', body: 'To run your account, deliver what you paid for, recommend content, and keep the platform safe.' },
      { heading: 'Who we share it with', body: 'Our payment provider, our streaming infrastructure, and authorities where the law requires it. We do not sell your data.' },
      { heading: 'Your choices', body: 'You can change notification preferences and data saver settings at any time, and you can delete your account and its data.' },
      { heading: 'Placeholder notice', body: 'This wording is a structural placeholder and must be replaced with text prepared by a qualified lawyer before launch.' },
    ],
  },

  guidelines: {
    slug: 'guidelines',
    title: 'Community Guidelines',
    updated: '5 August 2026',
    sections: [
      { heading: 'Own what you upload', body: 'Only upload work you made or have permission to publish. Music, clips and footage owned by others will be removed.' },
      { heading: 'No content involving minors in a sexual context', body: 'This results in immediate removal and a permanent ban, and is reported to the authorities.' },
      { heading: 'No hate or harassment', body: 'Content attacking people for who they are is removed. Repeat offences end the account.' },
      { heading: 'Label mature content', body: 'Use the 13+ and 18+ ratings honestly so viewers and parents can make their own choices.' },
      { heading: 'No scams', body: 'Misleading thumbnails, fake giveaways and payment scams are removed and reported.' },
      { heading: 'Reporting', body: 'Anyone can report content from the menu on any title or vertical. Reports are anonymous to the creator.' },
    ],
  },
};

export const FAQ = [
  { q: 'How do I pay for a film?', a: 'Top up your CloudNet wallet, then buy with one tap. You can add money with a debit card, a bank transfer, or USDT on BNB Chain.' },
  { q: 'Do I keep what I buy?', a: 'Yes. Anything you buy stays in your Library and can be watched again any time.' },
  { q: 'Why can I only buy one episode at a time?', a: 'Creators release episodes as they finish them. Buying per episode means you never pay for something that has not been made yet.' },
  { q: 'My deposit has not arrived', a: 'Card and transfer usually land in seconds. Crypto waits for network confirmations, which normally takes a few minutes. Check Wallet, then Transactions, for the status and reference.' },
  { q: 'I sent the wrong amount of crypto', a: 'We credit whatever arrives at the rate you were quoted. If you sent less than expected, you get less credit, not nothing.' },
  { q: 'How much do creators earn?', a: 'Creators keep 70 percent of every sale. You can see the exact split before you publish.' },
  { q: 'When do I get paid?', a: 'Request a withdrawal from your creator dashboard. Payouts are reviewed and usually land within one working day.' },
  { q: 'Why is my upload still in review?', a: 'Everything new is checked before it goes public, usually within a few hours. You can track it under My uploads.' },
  { q: 'How do I report something?', a: 'Tap the menu on any title or vertical and choose Report. Reports are anonymous to the creator.' },
  { q: 'How do I delete my account?', a: 'Settings, then Delete account. This removes your profile and content. Purchase records are kept where the law requires it.' },
];
