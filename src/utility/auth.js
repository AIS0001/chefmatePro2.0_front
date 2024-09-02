// auth.js
const isAuthenticated = () => {
    return !!localStorage.getItem("authToken");
};

export default isAuthenticated;
