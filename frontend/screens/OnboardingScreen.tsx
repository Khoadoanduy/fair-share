import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    // Only keep initial app onboarding features
    const features = [
        {
            id: '1',
            title: 'Welcome to Fair Share',
            description: 'The easiest way to split and track expenses with friends and family.'
        },
        {
            id: '2',
            title: 'Split Expenses Easily',
            description: 'Share costs with friends and family for trips, meals, bills, and more.'
        },
        {
            id: '3',
            title: 'Track Balances',
            description: 'Always know who owes what with real-time balance tracking.'
        }
    ];

    const [currentFeature, setCurrentFeature] = useState(0);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);

    // Simplified - no need to check isPostSignup
    const markAsComplete = async () => {
        try {
            await AsyncStorage.setItem('onboardingComplete', 'true');
            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };

    const handleNext = () => {
        if (currentFeature < features.length - 1) {
            setCurrentFeature(currentFeature + 1);
        } else {
            markAsComplete();
        }
    };

    // Simplified navigation - always go to welcome
    if (onboardingCompleted) {
        return <Redirect href="/(welcome)" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={markAsComplete} style={styles.skipContainer}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Empty space for illustration */}
            <View style={styles.imageArea} />

            <View style={styles.contentContainer}>
                <Text style={styles.featureTitle}>
                    {features[currentFeature].title}
                </Text>
                <Text style={styles.featureDescription}>
                    {features[currentFeature].description}
                </Text>

                <View style={styles.dotsContainer}>
                    {features.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: index === currentFeature ? '#000' : '#D3D3D3' }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity 
                    onPress={handleNext} 
                    style={styles.nextButton}
                >
                    <Text style={styles.nextText}>
                        {currentFeature === features.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// Keep your existing styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    skipContainer: {
        alignSelf: 'flex-end',
        padding: 16,
        marginTop: 8,
        zIndex: 10,
    },
    skipText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '400',
    },
    imageArea: {
        flex: 1,
    },
    contentContainer: {
        backgroundColor: '#F0F4F8',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        paddingBottom: 40,
    },
    featureTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featureDescription: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
        marginBottom: 30,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    nextButton: {
        alignSelf: 'flex-end',
    },
    nextText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
});