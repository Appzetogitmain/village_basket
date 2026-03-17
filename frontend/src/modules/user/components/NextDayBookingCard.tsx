import { useNavigate } from "react-router-dom";
import { useThemeContext } from "../../../context/ThemeContext";

export default function NextDayBookingCard() {
  const navigate = useNavigate();
  const { currentTheme: theme } = useThemeContext();

  return (
    <div className="mx-4 mt-6 mb-2">
      <div
        onClick={() => navigate("/tomorrow-veg-booking")}
        className="relative overflow-hidden organic-radius p-4 shadow-sm border cursor-pointer flex items-center justify-between transition-all hover:shadow-md village-card border-none"
        style={{
          background: `linear-gradient(to right, #FFF9F0, #FF993315)`,
        }}
      >
        <div className="z-10 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-white text-[10px] uppercase font-black px-2 py-0.5 organic-radius tracking-wide"
              style={{ backgroundColor: '#B22222' }}
            >
              Gaon Ka Swad
            </span>
          </div>
          <h3
            className="text-lg font-black leading-tight mb-1"
            style={{ color: '#3E2723' }}
          >
            Kal Ki Sabzi <br /> Aaj Hi Book Karein 🥕
          </h3>
          <p
            className="text-xs font-medium mb-3 opacity-90"
            style={{ color: theme.textColor }}
          >
            Guaranteed morning delivery
          </p>
          <button
            className="text-white text-xs font-bold px-6 py-2 organic-radius shadow-md transition-all active:scale-95"
            style={{ backgroundColor: '#B22222' }}
          >
            Abhi Book Karein
          </button>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-20 bg-no-repeat bg-contain bg-right-bottom pointer-events-none"
          style={{ backgroundImage: "url('https://cdn-icons-png.flaticon.com/512/2909/2909787.png')" }}>
        </div>
        <div className="z-10 w-24 h-24 flex items-center justify-center pointer-events-none">
          {/* Placeholder icon if background image fails or for styling */}
          <span className="text-6xl drop-shadow-lg filter grayscale-0">🥬</span>
        </div>
      </div>
    </div>
  );
}
