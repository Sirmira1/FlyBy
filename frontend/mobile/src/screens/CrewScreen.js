import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function CrewScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Crew</Text>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center'},
    text: {
        color: COLORS.textMuted,
        fontSize: 14,
        letterSpacing: 1,
    },
});