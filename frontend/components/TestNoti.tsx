import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

const WebSocketDemo: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const ws = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket server
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);
  
  const connectWebSocket = (): void => {
    ws.current = new WebSocket('ws://localhost:8080');
    
    ws.current.onopen = () => {
      setIsConnected(true);
      addMessage('Connected to server');
    };
    
    ws.current.onmessage = (e) => {
      addMessage(`Received: ${e.data}`);
    };
    
    ws.current.onerror = (e) => {
      addMessage('WebSocket error');
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      addMessage('Disconnected from server');
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
  };
  
  const addMessage = (message: string): void => {
    setMessages(prevMessages => [...prevMessages, message]);
  };
  
  const sendMessage = (): void => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && inputMessage) {
      ws.current.send(inputMessage);
      addMessage(`Sent: ${inputMessage}`);
      setInputMessage('');
    } else if (!inputMessage) {
      addMessage('Cannot send empty message');
    } else {
      addMessage('Not connected to server');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Chat</Text>
      
      <Text style={styles.status}>
        Status: <Text style={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </Text>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <Text key={i} style={styles.message}>{msg}</Text>
        ))}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          onSubmitEditing={sendMessage}
        />
        <Button
          title="Send"
          onPress={sendMessage}
          disabled={!isConnected}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  connected: {
    color: 'green',
    fontWeight: 'bold',
  },
  disconnected: {
    color: 'red',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: 'white',
  },
});

export default WebSocketDemo;