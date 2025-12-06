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
}

 const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Better Auth handles authentication via Convex
    // This is a compatibility layer for any components that might use this context
    
    const signUp = async (email: string, password: string) => {
        // Handled by Better Auth
        return "Use Better Auth for authentication";
    };
    
    const signIn = async (email: string, password: string) => {
        // Handled by Better Auth
        return "Use Better Auth for authentication";
    };

    const signOut = async () => {
        // Handled by Better Auth
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
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
