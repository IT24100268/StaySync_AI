const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default {
  expo: {
    name: "StaySync AI",
    slug: "staysync-ai",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#0B5D7A",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "StaySync AI uses your location so you can pick restaurant and delivery locations on the map.",
      },
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      package: "com.paviththiran.staysyncai",
      adaptiveIcon: {
        backgroundColor: "#0B5D7A",  
      },
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      bundler: "metro",
    },
    extra: {
      eas: {
        projectId: "2307313c-b3ac-40b2-9252-51c09d0c8549",
      },
    },
  },
};
