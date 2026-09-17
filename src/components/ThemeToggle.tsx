"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/context/ThemeContext";
import { SunIcon, MoonIcon } from "@/components/Icons";

interface ThemeToggleButtonProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggleButton({
  showLabel = true,
  className = "",
}: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={(e) => toggleTheme(e)}
      type="button"
      id="theme-toggle-button"
      title={isDark ? "Switch to Day Journal (Light Mode)" : "Switch to Night Desk (Dark Mode)"}
      className={`group relative overflow-hidden px-2.5 sm:px-3 py-1.5 bg-[#fbf6dd] dark:bg-[#241f17] hover:bg-[#f5eecc] dark:hover:bg-[#332d22] text-slate-800 dark:text-amber-300 font-bold border-2 border-slate-700/80 dark:border-[#4d4337] rounded-xl shadow-[1px_1px_0px_#334155] sm:shadow-[2px_2px_0px_#334155] dark:shadow-[2px_2px_0px_#080706] active:translate-x-[1px] active:translate-y-[1px] hand-drawn-box transition-all duration-300 cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-['Patrick_Hand',cursive] select-none ${className}`}
    >
      {/* Animated Icon Container with spring rotation & pop */}
      <div className="relative w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun-icon"
              initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 22,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <SunIcon className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon-icon"
              initial={{ rotate: 90, scale: 0.3, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.3, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 22,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <MoonIcon className="w-3.5 h-3.5 text-indigo-900 drop-shadow-[0_0_6px_rgba(99,102,241,0.25)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animated Label Text */}
      {showLabel && (
        <div className="relative overflow-hidden h-4.5 flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: isDark ? 10 : -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isDark ? -10 : 10, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="inline-block whitespace-nowrap"
            >
              {isDark ? "Day" : "Night"}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </button>
  );
}
