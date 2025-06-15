import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-expo';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type PaymentContextType = {
    hasPaymentMethod: boolean;
    checkPaymentMethod: () => Promise<void>;
};

// Create the PaymentContext
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
    children: ReactNode;
}

export const PaymentProvider = ({ children }: PaymentProviderProps) => {
    const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(false);
    const {user} = useUser();
    const clerkId = user?.id;
    console.log(clerkId)
    const userFromMongo = async () => {
        try{
            const response = await axios.get(`${API_URL}/api/user/`,{
                params:{
                    clerkID : clerkId
                }
            })
            return response.data.email
        }
        catch(error){
            console.error("Error fetching user data:", error);
        }
    }
    const checkPaymentMethod = async () => {
    }
    

    // Optionally, you can call checkPaymentMethod on mount.
    useEffect(() => {
        checkPaymentMethod();
    }, []);

    return (
        <PaymentContext.Provider 
            value={{ hasPaymentMethod, checkPaymentMethod }}>
            {children}
        </PaymentContext.Provider>
    );
};

// Custom hook to use the PaymentContext
export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within a PaymentProvider');
    }
    return context;
};