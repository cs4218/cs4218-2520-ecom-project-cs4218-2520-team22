import { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    axios.defaults.headers.common["Authorization"] = auth?.token;

    useEffect(() => {
        const data = localStorage.getItem("auth");
        try {
            if (data) {
                const parseData = JSON.parse(data);
                setAuth({
                    ...auth,
                    user: parseData.user,
                    token: parseData.token,
                });
            }
        } catch (error) {
            console.log("Something went wrong with localStorage", error);
        }
    }, []);
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };