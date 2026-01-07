
require('dotenv/config');

module.exports = {
  expo: {
    name: "Mossombi",
    slug: "mossombi",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mossombi",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon-light.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mossombi.app",
      infoPlist: {
        NSFaceIDUsageDescription: "Mossombi utilise Face ID pour sécuriser votre compte et vos transactions financières."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mossombi.app"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-splash-screen",
      "expo-local-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff",
          defaultChannel: "default"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      // Variables d'environnement sécurisées
      apiBaseUrl: process.env.API_BASE_URL,
      appName: process.env.APP_NAME,
      appVersion: process.env.APP_VERSION,
      environment: process.env.APP_ENVIRONMENT,
      // Configuration EAS pour les notifications
      eas: {
        projectId: "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  }
};
