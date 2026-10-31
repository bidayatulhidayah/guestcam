import { describe, expect, it } from 'vitest';
import { chromeIntentUrl, detectInAppBrowser, platformOf } from '../src/lib/device/inAppBrowser';

const UA = {
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 621829209)',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36 Instagram 339.0.0.38.84 Android (34/14; 450dpi; 1080x2125; samsung; SM-A546E; a54x; s5e8835; en_GB; 619813911)',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/466.0.0.39.106;FBBV/608174405;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5;FBRV/610036017]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.166 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/427.0.0.31.63;]',
  messengerIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/425.0.0.27.105;FBBV/528315377;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/16.6;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]',
  tiktokAndroid:
    'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 trill_340903 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/34.9.3 ByteLocale/en ByteFullLocale/en Region/MY BytedanceWebview/d8a21c6',
  lineIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.18.0',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  samsungInternet:
    'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
};

describe('in-app browser detection (pitfall I1)', () => {
  it('finds the app and the platform', () => {
    expect(detectInAppBrowser(UA.instagramIos)).toEqual({ app: 'instagram', platform: 'ios' });
    expect(detectInAppBrowser(UA.instagramAndroid)).toEqual({ app: 'instagram', platform: 'android' });
    expect(detectInAppBrowser(UA.facebookIos)).toEqual({ app: 'facebook', platform: 'ios' });
    expect(detectInAppBrowser(UA.facebookAndroid)).toEqual({ app: 'facebook', platform: 'android' });
    expect(detectInAppBrowser(UA.messengerIos)).toEqual({ app: 'messenger', platform: 'ios' });
    expect(detectInAppBrowser(UA.tiktokAndroid)).toEqual({ app: 'tiktok', platform: 'android' });
    expect(detectInAppBrowser(UA.lineIos)).toEqual({ app: 'line', platform: 'ios' });
  });

  it('leaves real browsers alone', () => {
    for (const ua of [UA.safariIos, UA.chromeAndroid, UA.samsungInternet, UA.desktopChrome]) {
      expect(detectInAppBrowser(ua)).toBeNull();
    }
    expect(platformOf(UA.samsungInternet)).toBe('android');
    expect(platformOf(UA.desktopChrome)).toBe('other');
  });

  it('builds a Chrome link for the same address, code included', () => {
    const url = chromeIntentUrl({
      host: 'example.web.app',
      pathname: '/s/7k3qmxa/tunang-k7q2',
      search: '',
      href: 'https://example.web.app/s/7k3qmxa/tunang-k7q2',
    });
    expect(url).toBe(
      'intent://example.web.app/s/7k3qmxa/tunang-k7q2#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fexample.web.app%2Fs%2F7k3qmxa%2Ftunang-k7q2;end',
    );
  });
});
