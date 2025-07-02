import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PersonalSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onExistingPress: () => void;
  onVirtualCardPress: () => void;
}

const PersonalSubscriptionModal: React.FC<PersonalSubscriptionModalProps> = ({
  visible,
  onClose,
  onExistingPress,
  onVirtualCardPress,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>How would you like to add your subscription?</Text>
          
          <Pressable 
            style={styles.optionButton}
            onPress={onExistingPress}
          >
            <View style={styles.bulletPoint} />
            <View style={styles.textContainer}>
              <Text style={styles.optionText}>
                Link an existing subscription
              </Text>
              <Text style={styles.optionSubtext}>
                Add your current subscription to track expenses and get insights
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.optionButton}
            onPress={onVirtualCardPress}
          >
            <View style={styles.bulletPoint} />
            <View style={styles.textContainer}>
              <Text style={styles.optionText}>
                Start with a virtual card (US only)
              </Text>
              <Text style={styles.optionSubtext}>
                Get a virtual card for your subscription purchases. Powered by Stripe issuing.
              </Text>
              <Text style={styles.featureText}>
                • Receive notifications when payments are made{'\n'}
                • Track subscription expenses automatically{'\n'}
                • Easy to cancel or suspend card services
              </Text>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A3DE3',
    marginTop: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default PersonalSubscriptionModal;