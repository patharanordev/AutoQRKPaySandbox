# **Auto-Payment for K-Payment sandbox's ThaiQR**

## Installation

Clear old-dependencies :

```sh
rm -rf node_modules package-lock.json Gemfile.lock yarn.lock ios/Podfile.lock android/app/build
```

Install dependencies :

```sh
yarn
```

Pods install :

```sh
cd ios && (pod install || :) && cd ..
```

## Usage

```sh
yarn android

# or
# yarn ios
```

Then to run all services, including websocket & kafka & web scrapping :

```sh
yarn start:server
```

## Contribute

- [How-to-setup-project](https://learn.patharanor.dev/blog/en/qr-code-scanner-in-react-native)