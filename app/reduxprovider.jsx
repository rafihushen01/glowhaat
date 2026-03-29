"use client";

import { Provider } from "react-redux";
import { Store } from "./reduxcomponents/Store";

export default function ReduxProvider({ children }) {
  return <Provider store={Store}>{children}</Provider>;
}
