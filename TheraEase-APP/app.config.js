export default {
  expo: {
    name: "TheraHome",
    slug: "therahome-app",
    version: "1.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "vn.therahome.app",
      buildNumber: "4",
      infoPlist: {
        LSApplicationQueriesSchemes: ["https", "http"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "vn.therahome.app",
      versionCode: 2,
      permissions: [
        "CAMERA",
        "NOTIFICATIONS"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#2563eb"
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Ứng dụng cần quyền camera để quét mã QR kích hoạt thiết bị"
        }
      ]
    ],
    scheme: "therahome",
    extra: {
      eas: {
        projectId: "f5acbc19-9567-4d18-b661-0cc17010582f"
      }
    }
  }
};
