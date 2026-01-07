const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour améliorer la résolution des assets
config.resolver.assetExts.push(
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2',
  // Audio/Video
  'mp3', 'mp4', 'mov', 'avi'
);

// Configuration pour les assets
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
