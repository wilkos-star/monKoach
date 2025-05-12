import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
// import * as SecureStore from 'expo-secure-store'; // Remove this line
import { supabase, checkUserVerification } from '../lib/supabase'; // Corrected path from ../../

// Define the shape of our custom user object
export interface WhatsAppUser {
    id: string;
    phone_number: string;
    nom: string | null;
    auth_token: string;
    is_verified: boolean;
    email: string | null;
    // Add any other user-specific fields you might need from your 'users' table
}

// Define the shape of the context value
export interface AuthProviderValue {
    user: WhatsAppUser | null;
    loading: boolean;
    signInUser: (userData: WhatsAppUser) => void; // Changed from Promise<void> to void
    signOutUser: () => void; // Changed from Promise<void> to void
    // We no longer need signUp in the old sense, it's handled by PhoneNumberScreen -> upsertUserByPhoneNumber
}

const AuthContext = createContext<AuthProviderValue | null>(null); // Initialize with null

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<WhatsAppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserFromStorage = () => { // Make synchronous
            setLoading(true);
            try {
                const storedUserId = localStorage.getItem('userId'); // Use localStorage
                const storedUserToken = localStorage.getItem('userToken'); // Use localStorage

                if (storedUserId && storedUserToken) {
                    console.log('(AuthProvider) Found stored credentials, verifying...', { storedUserId });
                    // checkUserVerification is async, so we need to handle its promise
                    checkUserVerification(storedUserId)
                        .then(({ data: userData, error }) => {
                            if (error) {
                                console.error('(AuthProvider) Error verifying stored user:', error.message);
                                clearStoredCredentials(); 
                            } else if (userData && userData.is_verified && userData.auth_token === storedUserToken) {
                                if (userData.email) {
                                    console.log('(AuthProvider) User verified successfully from storage (profile complete):', userData);
                                    setUser(userData as WhatsAppUser);
                                } else {
                                    console.log('(AuthProvider) User verified from storage BUT profile incomplete. Clearing credentials to force re-flow.', userData);
                                    clearStoredCredentials(); 
                                }
                            } else {
                                console.log('(AuthProvider) Stored user not verified or token mismatch, clearing credentials.');
                                clearStoredCredentials();
                            }
                        })
                        .catch(e => { // Catch errors from checkUserVerification
                            console.error('(AuthProvider) Error during checkUserVerification:', e);
                            clearStoredCredentials();
                        })
                        .finally(() => {
                            setLoading(false); // setLoading false after async operation
                        });
                } else {
                    console.log('(AuthProvider) No stored credentials found.');
                    setLoading(false); // setLoading false if no credentials
                }
            } catch (e) {
                console.error('(AuthProvider) Failed to load user from storage:', e);
                clearStoredCredentials(); // This might be redundant if the main error is from checkUserVerification
                setLoading(false); // setLoading false on catch
            }
            // setLoading(false) was here, moved into promise/path specific flows
        };

        loadUserFromStorage();
        
        // No need for Supabase onAuthStateChange listener anymore for this custom flow
        // If you still use Supabase auth for other things, you might need it.

    }, []);

    const clearStoredCredentials = () => { // Make synchronous
        console.log('(AuthProvider) Clearing stored credentials and setting user to null.');
        localStorage.removeItem('userId'); // Use localStorage
        localStorage.removeItem('userToken'); // Use localStorage
        setUser(null);
    };

    const signInUser = (userData: WhatsAppUser) => { // Make synchronous if only setting state
        setLoading(true);
        // Note: localStorage.setItem should now be set *before* calling signInUser
        setUser(userData);
        console.log('(AuthProvider) User signed in to context:', userData);
        setLoading(false);
    };

    const signOutUser = () => { // Make synchronous
        setLoading(true);
        clearStoredCredentials();
        // If you have any other global state to clear on sign out, do it here
        console.log('(AuthProvider) User signed out from context.');
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInUser, signOutUser }}>
            {children}
        </AuthContext.Provider>
    );
}; 