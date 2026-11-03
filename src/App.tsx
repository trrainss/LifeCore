import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks/useAuth";
import { AppStateProvider } from "./hooks/useAppState";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import AntiHabits from "./pages/AntiHabits";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Health from "./pages/Health";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

/** Защита маршрутов: неавторизованных отправляем на вход */
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null; // сессия ещё проверяется
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Авторизованных не пускаем на страницы входа/регистрации */
function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="*"
        element={
          <RequireAuth>
            {/* AppStateProvider монтируется только после входа */}
            <AppStateProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/anti-habits" element={<AntiHabits />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/health" element={<Health />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppStateProvider>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
