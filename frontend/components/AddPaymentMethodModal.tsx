import React from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";

interface PaymentPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onLinkPayment: () => void;
}

const PaymentPromptModal: React.FC<PaymentPromptModalProps> = ({ visible, onClose, onLinkPayment }) => {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Payment Method Required</Text>
          <Text style={styles.modalMessage}>
            You need to link a payment method before you can create a group.
          </Text>
          <Pressable style={styles.modalButton} onPress={onLinkPayment}>
            <Text style={styles.buttonText}>Link Payment Method</Text>
          </Pressable>
          <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", 
  },
  modalContainer: {
    width: 320,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    alignItems: "center",
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333", 
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: "#4A3DE3", 
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#4A3DE31A", 
    borderWidth: 1,
    borderColor: "transparent", 
  },
  cancelButtonText: {
    color: "#4A3DE3", 
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentPromptModal;
