import { createContext, useContext } from "react";

const ViewOptionsContext = createContext({});

export const ViewOptionsProvider = ViewOptionsContext.Provider;

export const useViewOptions = () => useContext(ViewOptionsContext);
