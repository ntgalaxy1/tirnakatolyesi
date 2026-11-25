/**
 * Tırnak Atölyesi — Capacitor Android Configuration (ir.tirnakatolyesi.app)
 * Configured for Cafe Bazaar (.apk) and Google Play (.aab)
 */
const config = {
  appId: 'ir.tirnakatolyesi.app',
  appName: 'Tırnak Atölyesi',
  webDir: 'dist',
  server: {
    url: 'https://tirnakatolyesi.ir',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FAF0E6',
    buildOptions: {
      keystorePath: 'release-keystore.jks',
      keystoreAlias: 'tirnakatolyesi',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FAF0E6',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
