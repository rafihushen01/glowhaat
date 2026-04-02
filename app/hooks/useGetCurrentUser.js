"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverurl } from "../utils/constants/serverurl";
import { clearUserData, setUserData, setUserLoading } from "../reduxcomponents/UserSlice";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchCurrentUser = async () => {
      dispatch(setUserLoading(true));
      try {
        const res = await axios.get(`${serverurl}/auth/me`, {
          withCredentials: true,
          timeout: 12000,
        });
        if (res?.data?.success && res?.data?.user) {
          dispatch(setUserData(res.data.user));
        } else {
          dispatch(clearUserData());
        }
      } catch (error) {
        dispatch(clearUserData());
      } finally {
        dispatch(setUserLoading(false));
      }
    };

    fetchCurrentUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
