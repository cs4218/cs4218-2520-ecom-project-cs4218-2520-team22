import React, { useState,useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth] = useAuth();

  const authCheck = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/user-auth");
      setOk(Boolean(data?.ok));
    } catch (error) {
      // fail closed and swallow rejection
      setOk(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      authCheck();
    }
  }, [auth?.token]);

  return ok ? <Outlet /> : <Spinner path="" />;
}
