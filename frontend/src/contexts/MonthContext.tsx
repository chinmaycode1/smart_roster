import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/apiClient';

interface MonthContextType {
  month: number;
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setMonthYear: (month: number, year: number) => void;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonthState] = useState<number>(new Date().getMonth() + 1);
  const [year, setYearState] = useState<number>(new Date().getFullYear());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      api.get<Array<{ month: number; year: number }>>('/rosters?limit=1')
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            const latest = res.data[0];
            setMonthState(latest.month);
            setYearState(latest.year);
          }
        })
        .catch(() => {})
        .finally(() => setInitialized(true));
    }
  }, [initialized]);

  const setMonth = (m: number) => setMonthState(m);
  const setYear = (y: number) => setYearState(y);
  const setMonthYear = (m: number, y: number) => {
    setMonthState(m);
    setYearState(y);
  };

  return (
    <MonthContext.Provider value={{ month, year, setMonth, setYear, setMonthYear }}>
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth must be used within MonthProvider');
  }
  return context;
}
