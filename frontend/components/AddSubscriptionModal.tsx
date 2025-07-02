import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onPersonalPress: () => void;
  onGroupPress: () => void;
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  visible,
  onClose,
  onPersonalPress,
  onGroupPress,
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
          <Pressable 
            style={styles.optionButton}
            onPress={onPersonalPress}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={24} color="#4A3DE3" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Add a personal subscription</Text>
              <Text style={styles.optionSubtitle}>Add a personal subscription</Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.optionButton}
            onPress={onGroupPress}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="people-outline" size={24} color="#4A3DE3" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Create a group subscription</Text>
              <Text style={styles.optionSubtitle}>Add a personal subscription</Text>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 150,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default AddSubscriptionModal;