import { createContext, useContext, useState } from "react";

export interface IUserAuth {
  token: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  avatar?: string;
  status?: string;
}

interface AppContextType {
  theme: string;
  setTheme: (v: string) => void;
  appState: IUserAuth | null;
  setAppState: (v: IUserAuth | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface IProps {
  children: React.ReactNode;
}

export const useCurrentApp = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useCurrentApp must be used within AppProvider");
  return context;
};

const AppProvider = (props: IProps) => {
  const [theme, setTheme] = useState<string>("");
  const [appState, setAppState] = useState<IUserAuth | null>(null);

  return (
    <AppContext.Provider value={{ theme, setTheme, appState, setAppState }}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppProvider;
