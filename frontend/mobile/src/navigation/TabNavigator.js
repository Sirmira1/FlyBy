import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import ProfileScreen from '../screens/ProfileScreen';
import GarageScreen from '../screens/GarageScreen';
import CrewScreen from '../screens/CrewScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import MapScreen from '../screens/MapScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const TABS = [
    { name: 'Map', component: MapScreen, icon: 'map' },
    { name: 'Leaderboard', component: LeaderboardScreen, icon: 'trophy' },
    { name: 'Crew', component: CrewScreen, icon: 'people' },
    { name: 'Garage', component: GarageScreen, icon: 'car-sport' },
    { name: 'Profile', component: ProfileScreen, icon: 'person' },
];
export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: { backgroundColor: 'rgba(10, 10, 20, 0.97)',
                borderTopColor: 'rgba(255, 255, 255, 0.07)', borderTopWidth: 1, 
                paddingBottom: 8, paddingTop: 8 ,
                height: 64},
                tabBarActiveTintColor: COLORS.purpleLight,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: { fontSize: 10, marginTop: 2},
                tabBarIcon: ({ focused, color, size }) => {
                    const tab = TABS.find(t => t.name === route.name);
                    return (
                        <Ionicons name={focused ? tab.icon : tab.icon + '-outline'} size={22} color={color} />
                    );
                },
            })}
        >
            {TABS.map(tab => (
                <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
            ))}
        </Tab.Navigator>
    );
}