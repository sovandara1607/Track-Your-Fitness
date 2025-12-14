import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { createContext, useContext, useState } from "react";

type User = {
    id: string;
    email: string;
    name?: string;
};

type AuthContextType = {
    user: User | null;
    signUp: (email: string, password: string) => Promise<string | null>;
    signIn: (email: string, password: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    
    const signUpMutation = useMutation(api.users.signUp);
    const signInMutation = useMutation(api.users.signIn);
    
    const signUp = async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await signUpMutation({
                email,
                password,
                name: email.split('@')[0],
            });
            
            setUser({
                id: result.userId,
                email: result.email,
                name: result.name,
            });
            return null;
        } catch (error: any) {
            return error.message || "Sign up failed";
        } finally {
            setLoading(false);
        }
    };
    
    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await signInMutation({
                email,
                password,
            });
            
            setUser({
                id: result.userId,
                email: result.email,
                name: result.name,
            });
            return null;
        } catch (error: any) {
            return error.message || "Invalid credentials";
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            signUp, 
            signIn, 
            signOut, 
            loading,
            isAuthenticated: user !== null 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
