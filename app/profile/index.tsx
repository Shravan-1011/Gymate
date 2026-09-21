    import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    } from 'react-native';

    import { router } from 'expo-router';

    import { useEffect } from 'react';

    import { useProfile } from '../../context/ProfileContext';

    import {
    colors,
    } from '../../constants/theme';

    export default function ProfileGateScreen() {
    const {
        isLoading,
        isAuthenticated,
    } = useProfile();

    useEffect(() => {
        if (isLoading) {
        return;
        }

        if (isAuthenticated) {
        router.replace('/(tabs)');
        return;
        }

        router.replace('/profile/create');
    }, [
        isLoading,
        isAuthenticated,
    ]);

    return (
        <View
        style={styles.container}
        >
        <Text
            style={styles.title}
        >
            GYMATE
        </Text>

        <ActivityIndicator
            size="small"
            color={colors.primary}
        />

        <Text
            style={styles.text}
        >
            LOADING PROFILE...
        </Text>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,

        backgroundColor:
        colors.background,

        alignItems: 'center',

        justifyContent: 'center',
    },

    title: {
        fontFamily:
        'PressStart2P',

        fontSize: 20,

        color:
        colors.primary,

        marginBottom: 24,
    },

    text: {
        fontFamily:
        'VT323',

        fontSize: 20,

        color:
        colors.textSecondary,

        marginTop: 12,
    },
    });