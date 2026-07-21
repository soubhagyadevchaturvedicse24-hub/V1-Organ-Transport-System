import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('neolife_user');
    const storedToken = localStorage.getItem('neolife_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setTokenState(storedToken);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');

      const loggedInUser = result.data.user;
      const token = result.data.accessToken;

      setUser(loggedInUser);
      setTokenState(token);
      localStorage.setItem('neolife_user', JSON.stringify(loggedInUser));
      localStorage.setItem('neolife_token', token);
      
      return loggedInUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    localStorage.removeItem('neolife_user');
    localStorage.removeItem('neolife_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
