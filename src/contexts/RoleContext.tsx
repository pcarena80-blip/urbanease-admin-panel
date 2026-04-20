import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'superadmin' | 'admin' | 'user' | null;

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      return null;
    }

    try {
      const user = JSON.parse(adminUser);
      return user.role || null;
    } catch (e) {
      console.error('Failed to parse adminUser', e);
      return null;
    }
  });

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
