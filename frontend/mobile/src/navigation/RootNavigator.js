import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../store/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { COLORS } from '../constants/theme';

export default function RootNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return user ? <TabNavigator /> : <AuthNavigator />;
}