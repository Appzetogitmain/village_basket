import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateTrackerContextType {
  selectedDeliveryDate: Date | null;
  setSelectedDeliveryDate: (date: Date | null) => void;
}

const DateTrackerContext = createContext<DateTrackerContextType | undefined>(undefined);

export const DateTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('selectedDeliveryDate');
    if (saved) {
      const date = new Date(saved);
      // Ensure it's still valid (e.g. not in the past)
      const today = new Date();
      today.setHours(0,0,0,0);
      if (date >= today) return date;
    }
    return null;
  });

  const updateDate = (date: Date | null) => {
    setSelectedDeliveryDate(date);
    if (date) {
      localStorage.setItem('selectedDeliveryDate', date.toISOString());
    } else {
      localStorage.removeItem('selectedDeliveryDate');
    }
  };

  return (
    <DateTrackerContext.Provider value={{ selectedDeliveryDate, setSelectedDeliveryDate: updateDate }}>
      {children}
    </DateTrackerContext.Provider>
  );
};

export const useDateTracker = () => {
  const context = useContext(DateTrackerContext);
  if (context === undefined) {
    throw new Error('useDateTracker must be used within a DateTrackerProvider');
  }
  return context;
};
