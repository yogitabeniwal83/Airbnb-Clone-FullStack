import { createContext, useState } from "react";

// This file intentionally exports the context together with its small provider.
// eslint-disable-next-line react-refresh/only-export-components
export const HomeContext = createContext();

export function HomeProvider({ children }) {

  const [homes, setHomes] = useState([]);

  return (
    <HomeContext.Provider
      value={{
        homes,
        setHomes
      }}
    >
      {children}
    </HomeContext.Provider>
  );
}
