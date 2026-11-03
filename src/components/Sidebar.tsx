import { NavLink, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useAuth } from "../hooks/useAuth";

const nav = [
  { to: "/", label: "Панель дня", icon: "dashboard" },
  { to: "/habits", label: "Привычки", icon: "habit" },
  { to: "/anti-habits", label: "Анти-привычки", icon: "shield" },
  { to: "/tasks", label: "Задачи", icon: "check" },
  { to: "/finance", label: "Финансы", icon: "wallet" },
  { to: "/health", label: "Здоровье", icon: "heart" },
  { to: "/analytics", label: "Аналитика", icon: "chart" },
  { to: "/settings", label: "Настройки", icon: "gear" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  return (
    <>
      {/* Затемнение для мобильного меню */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col px-4 py-6 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col rounded-xl bg-white/85 p-4 shadow-[0_20px_30px_-6px_rgba(28,28,30,0.10)] backdrop-blur-xl">
          {/* Логотип: тонкое кольцо + точка */}
          <div className="mb-6 flex items-center gap-3 px-2 pt-1">
            <span className="text-core-ink">
              <Icon name="logo" size={30} />
            </span>
            <div className="min-w-0">
              <div className="text-[17px] font-bold tracking-tight">
                LifeCore
              </div>
              <div className="truncate text-[11px] font-medium text-core-muted">
                система управления жизнью
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-core-accent text-white shadow-[0_10px_20px_-8px_rgba(77,163,255,0.6)]"
                      : "text-core-muted hover:bg-black/[0.04] hover:text-core-ink"
                  }`
                }
              >
                <Icon name={item.icon} size={19} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Аккаунт и выход */}
          <div className="mt-4 border-t border-black/5 pt-3">
            <div className="mb-2 truncate px-3 text-xs text-core-muted">
              {user?.email}
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-core-muted transition-all duration-200 hover:bg-core-bad/[0.07] hover:text-core-bad"
            >
              <Icon name="close" size={17} />
              Выйти
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
