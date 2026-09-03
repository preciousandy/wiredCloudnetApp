import { Platform, Share } from 'react-native';

import { toast } from '@/store/toast';

/**
 * Share links point at a real https URL rather than the cloudnet:// scheme.
 *
 * A custom scheme sent to someone without the app installed opens nothing. A web
 * link works for everyone and deep links into the app for those who have it.
 */
const WEB_BASE = 'https://cloudnet.app';

export function titleUrl(titleId: string): string {
  return `${WEB_BASE}/title/${titleId}`;
}

export function verticalUrl(verticalId: string): string {
  return `${WEB_BASE}/v/${verticalId}`;
}

export function creatorUrl(handle: string): string {
  return `${WEB_BASE}/@${handle}`;
}

export async function shareLink(url: string, message: string): Promise<boolean> {
  try {
    const content = Platform.OS === 'ios' ? { message, url } : { message: `${message}\n${url}`, url };
    const result = await Share.share(content);
    if (result.action === Share.sharedAction) {
      toast.success('Link shared successfully');
      return true;
    }
    return false;
  } catch {
    toast.error('Could not open the share sheet');
    return false;
  }
}

