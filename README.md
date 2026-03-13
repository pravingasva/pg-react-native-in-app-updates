# sp-react-native-in-app-updates

## Getting started

<br>

### What is this?

This is a **react-native native module** that works on both **iOS** and **Android**, and checks the stores (play/app) for a new version of your app and can prompt your user for an update.

It uses **embedded** [in-app-updates via Play-Core](https://developer.android.com/guide/playcore/in-app-updates) on Android (to check & download google play patches natively from within the app), and [react-native-siren](https://github.com/GantMan/react-native-siren) on iOS (to check & navigate the user to the AppStore).

### Why?
Because to this day I'm not aware of any react-native libraries that use play core to offer embedded in-app-updates besides this one


<br>

## Installation

`$ npm install sp-react-native-in-app-updates --save`

<br>

##### iOS only:

On **React Native iOS** you may need to also add the following lines in your Info.plist to be able to launch the store deep link.

```
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>itms-apps</string>
</array>
```
For **Expo Apps** Add the following to your expo `app.json` or `app.config.json` .

```
"ios": {
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["itms-apps"]
      }
    },
```
Next, rebuild the native files using ```npx expo prebuild --clean && eas build -p ios```

<br>

##### Note:

This project uses [`react-native-device-info`](https://github.com/react-native-device-info/react-native-device-info#installation) in the background. Install it to ensure everything works correctly.

### Requirements

- **React Native:** 0.60+ (autolinking required)
- **Android:** minSdkVersion 21 (Lollipop) and AndroidX
- **Google Play:** must install from Play (internal sharing or testing track) for in-app updates to work

### Expo:

In order to make it work using **Expo** you need to replace react-native-device-info dependency.

1. Create `react-native-device-info.js` file in root with following content. Requires expo-constants dependency. If you target iOS then you also need to ensure you add a bundleIdentifier to the ios section of your expo config.
```javascript
import Constants from "expo-constants"

export const getBundleId = () => {
    return Constants.expoConfig?.ios?.bundleIdentifier ?? '';
}
export const getVersion = () => {
    return Constants.expoConfig?.version
}
export default {
    getBundleId,
    getVersion,
};
```
2. Add alias to module-resolver configuration in babel.config.js
```javascript
plugins: [
  [
    'module-resolver',
    {
      root: ['.'],
      alias: {
        'react-native-device-info': './react-native-device-info.js'
      }
    }
  ],
  ...
]
```

## Usage



```ts
import InAppUpdates, {
  IAUUpdateKind,
  IAU_UPDATE_TYPE_AUTO,
  updateKindFromPriority,
} from 'sp-react-native-in-app-updates';

const inAppUpdates = new InAppUpdates(false);

const result = await inAppUpdates.checkNeedsUpdate();
if (!result.shouldUpdate) return;

// Android: result.other contains Play Core fields like updatePriority
const androidInfo = (result as any).other;

// Option A: let the library auto-select the mode based on Play priority
await inAppUpdates.startUpdate({});

// Option B: decide in JS (using the helper)
const updateType = updateKindFromPriority(
  androidInfo.updatePriority,
  androidInfo.clientVersionStalenessDays
);
await inAppUpdates.startUpdate({ updateType });

// Option C: force a specific mode
await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });

// Optional: allow Play Core to delete old asset packs during update
await inAppUpdates.startUpdate({
  updateType: IAU_UPDATE_TYPE_AUTO,
  allowAssetPackDeletion: true,
});
```
### Optional: country-specific App Store checks (iOS only)

```js
inAppUpdates
  .checkNeedsUpdate({ country: 'it' })
  .then((result) => {
    if (!result.shouldUpdate) return;

    inAppUpdates.startUpdate({
      title: 'Update available',
      message: 'There is a new version available in the App Store.',
      country: 'it',
    });
  });
```

---

## API reference

### `checkNeedsUpdate(checkOptions?: CheckOptions): Promise<NeedsUpdateResponse>`

Checks the store for a newer version.

### `startUpdate(updateOptions?: StartUpdateOptions): Promise<void>`

Starts the update flow (Play Core in-app update on Android, App Store prompt on iOS).

#### Android-specific `StartUpdateOptions`

- `updateType?: IAUUpdateKind | typeof IAU_UPDATE_TYPE_AUTO` — if not provided, the library uses play priority to choose `IMMEDIATE` or `FLEXIBLE`.
- `allowAssetPackDeletion?: boolean` — allow Play Core to delete old asset packs during the update.

---

## API options reference

### `checkNeedsUpdate(checkOptions?: CheckOptions)`

| Option | Type | Description |
|---|---|---|
| `curVersion` | `string` | Your current app version (semver). If omitted, it uses the native OS app version.| 
| `toSemverConverter` | `(version: string | number) => string` | Convert the store version into semver (useful when store version uses a different format).|
| `customVersionComparator` | `(v1: string, v2: string) => -1  0  1` | Custom comparator to decide whether an update is available (overrides built-in semver).|
| `country` | `string` | (iOS only) ISO 3166-1 alpha-2 country code to check a specific App Store region. |

### `startUpdate(updateOptions?: StartUpdateOptions)`

| Option | Type | Description |
|---|---|---|
| `updateType` | `IAUUpdateKind  IAU_UPDATE_TYPE_AUTO` | (Android only) Which Play Core mode to use. If omitted, the library chooses based on Play release priority. |
| `allowAssetPackDeletion` | `boolean` | (Android only) Allow Play Core to delete old asset packs during update (via `AppUpdateOptions`). |
| `title` | `string` | (iOS only) Title for the App Store prompt. |
| `message` | `string` | (iOS only) Body message for the App Store prompt. |
| `buttonUpgradeText` | `string` | (iOS only) Upgrade button text. |
| `buttonCancelText` | `string` | (iOS only) Cancel button text. |
| `country` | `string` | (iOS only) Country code for App Store lookup. |
| `versionSpecificOptions` | `Array<IosStartUpdateOptionWithLocalVersion>` | (iOS only) Version-specific rules for prompting. |

---

## Typical debugging workflow we had success with:

## Typical debugging workflow we had success with:

Debugging in-app-updates is tricky, so arm yourself with patience, enable debug logs by passing true to our library constructor. To enable `console.log` for _release_ you may need `react-native log-android` or `react-native log-ios`.

First of all use a **REAL device**.

##### Step 1: Enable **internal app sharing** (google it) on your android device

##### Step 2: Create a release apk (or aab) with the lower version of your app (i.e version 100)

(you don't like the debug variant right? Neither do we, but we couldn't find an easier way to check that everything's working fine - debug builds don't work with in-app-updates unfortunately)

##### Step 3: Create a release apk (or aab) with the higher version of your app (i.e version 101)

This is what you'd be updating to

##### Step 4: Upload both apk's to internal app sharing

##### Step 5: Install the version 100 on your device.

##### Step 6: Open the internal app sharing link of version 101 on your device but DON'T install it

Make sure that the button within that link says UPDATE (and NOT install)

That means google play knows there's an available update

##### Step 7: Open the installed (100) version of the app, and make sure that your code works (that you see an update popup)

Haven't really found any easier ways to test that everything works, but hey.. it get's the job done

<br>

## Troubleshooting
Keep in mind that this library is JUST a **WRAPPER** of the in-app-update api, so if you have trouble making in-app-updates work it's most probably because you're doing something wrong with google play.
<br>

- In-app updates works only with devices running Android 5.0 (**API level 21**) or higher.
- Testing this won’t work on a debug build. You would need a release build signed with the same key you use to sign your app before uploading to the Play Store (dummy signing can be used). It would be a good time to use the internal testing track.
- In-app updates are available only to user accounts that own the app. So, make sure the account you’re using has downloaded your app from Google Play at least once before using the account to test in-app updates.
- Because Google Play can only update an app to a higher version code, make sure the app you are testing as a lower version code than the update version code.
- Make sure the account is eligible and the Google Play cache is up to date. To do so, while logged into the Google Play Store account on the test device, proceed as follows:
Make sure you completely close the Google Play Store App.
Open the Google Play Store app and go to the My Apps & Games tab.

**Important: If the app you are testing doesn’t appear with an available update, don't bother checking for updates programmatically, because you'll probably never see any available updates via code either.**

<br>

## Contributing:

This library is offered as is, if you'd like to change something please open a PR

<br>

## Changelog

Read the [CHANGELOG.md](https://github.com/SudoPlz/sp-react-native-in-app-updates/blob/master/CHANGELOG.md) file

## License
MIT
