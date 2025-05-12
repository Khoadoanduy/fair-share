import React from "react";
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';

import { Link } from "expo-router";

export default function paymentMethod(){
    return (
        <View >
              <Link href="/collectPayment" asChild>
                <TouchableOpacity>
                  <Text>Payment</Text>
                </TouchableOpacity>
              </Link>
            </View> 
            
    );
}