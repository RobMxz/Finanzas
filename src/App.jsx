import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Spinner } from "@chakra-ui/react";
import useAppStore from "./store/useAppStore";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Savings from "./pages/Savings";
import Layout from "./components/layout/Layout";
import Profile from "./pages/Profile";

function PrivateRoute({ children }) {
  const { user, loading } = useAppStore();
  if (loading)
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Spinner size="xl" color="green.500" />
      </Box>
    );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAppStore();

  if (loading)
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Spinner size="xl" color="green.500" />
      </Box>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transacciones" element={<Transactions />} />
        <Route path="presupuestos" element={<Budgets />} />
        <Route path="ahorros" element={<Savings />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
