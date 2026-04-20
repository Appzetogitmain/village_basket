import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface DeliveryUserContextType {
  userName: string;
  setUserName: (name: string) => void;
  profileImage: string;
  setProfileImage: (imageUrl: string) => void;
}

const DeliveryUserContext = createContext<DeliveryUserContextType | undefined>(undefined);

export function DeliveryUserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState(() => {
    const savedName = localStorage.getItem('delivery_user_name');
    return savedName || '';
  });
  const [profileImage, setProfileImage] = useState(() => {
    const savedImage = localStorage.getItem('delivery_user_profile_image');
    return savedImage || '';
  });

  const updateUserName = useCallback((name: string) => {
    setUserName(name);
    localStorage.setItem('delivery_user_name', name);
  }, []);

  const updateProfileImage = useCallback((imageUrl: string) => {
    setProfileImage(imageUrl);
    if (imageUrl) {
      localStorage.setItem('delivery_user_profile_image', imageUrl);
    } else {
      localStorage.removeItem('delivery_user_profile_image');
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      userName,
      setUserName: updateUserName,
      profileImage,
      setProfileImage: updateProfileImage,
    }),
    [profileImage, updateProfileImage, updateUserName, userName]
  );

  return (
    <DeliveryUserContext.Provider value={contextValue}>
      {children}
    </DeliveryUserContext.Provider>
  );
}

export function useDeliveryUser() {
  const context = useContext(DeliveryUserContext);
  if (context === undefined) {
    throw new Error('useDeliveryUser must be used within a DeliveryUserProvider');
  }
  return context;
}

