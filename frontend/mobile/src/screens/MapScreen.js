import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { COLORS } from '../constants/theme';

const mapboxToken =
  Constants.expoConfig?.extra?.mapboxAccessToken ||
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  '';

if (mapboxToken) {
  MapboxGL.setAccessToken(mapboxToken);
}

export default function MapScreen() {
  if (!mapboxToken) {
    return (
      <View style={styles.missingTokenContainer}>
        <Text style={styles.missingTokenTitle}>Mapbox token missing</Text>
        <Text style={styles.missingTokenBody}>
          Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment, or set
          expo.extra.mapboxAccessToken in app.json.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} styleURL="mapbox://styles/mapbox/dark-v11"
      logoEnabled={false}
      attributionEnabled={false}
      compassEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={13}
          followUserLocation={true}
          followUserMode={'course'}
          animationMode={'flyTo'}
        />
        <MapboxGL.UserLocation visible={true} />
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  missingTokenContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  missingTokenTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  missingTokenBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  map: {
    flex: 1,
  },
});