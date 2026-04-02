"use client";

import { Provider } from "react-redux";
import { Store } from "./reduxcomponents/Store";
import useGetCurrentUser from "./hooks/useGetCurrentUser";

const UserBootstrap = () => {
  useGetCurrentUser();
  return null;
};

export default function ReduxProvider({ children }) {
  return (
    <Provider store={Store}>
      <UserBootstrap />
      {children}
    </Provider>
  );
}
