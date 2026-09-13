"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CommandBarProps {
  onSearch: (query: string) => void;
  onFilterTicker: (ticker: string | null) => void;
  currentTicker: string | null;
  onSetMinImportance: (val: number) => void;
}

export function CommandBar({
  onSearch,
  onFilterTicker,
  currentTicker,
  onSetMinImportance,
}: CommandBarProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(inputVal.trim());
    }
  };

  const executeCommand = (cmd: string) => {
    if (!cmd) return;

    if (cmd.startsWith("/news ")) {
      const ticker = cmd.replace("/news ", "").trim().toUpperCase();
      onFilterTicker(ticker);
      setInputVal("");
      return;
    }

    if (cmd.startsWith("/timeline ")) {
      const ticker = cmd.replace("/timeline ", "").trim().toUpperCase();
      router.push(`/company/${ticker}`);
      setInputVal("");
      return;
    }

    if (cmd.startsWith("/why ")) {
      const ticker = cmd.replace("/why ", "").trim().toUpperCase();
      router.push(`/company/${ticker}`);
      setInputVal("");
      return;
    }

    if (cmd.startsWith("/alert ")) {
      const val = parseFloat(cmd.replace("/alert ", "").trim());
      if (!isNaN(val)) {
        onSetMinImportance(val);
      }
      setInputVal("");
      return;
    }

    if (cmd === "/clear") {
      onFilterTicker(null);
      onSearch("");
      setInputVal("");
      return;
    }

    // Default search
    onSearch(cmd);
  };

  return (
    <div className="cmd-bar-wrapper">
      <span className="cmd-prefix">&gt;</span>
      <input
        type="text"
        className="cmd-input"
        placeholder="Type a command or filter (e.g. /news NVDA, /timeline AAPL, /why TSLA, /alert 0.75, /clear)..."
        value={inputVal}
        onChange={(e) => {
          setInputVal(e.target.value);
          if (!e.target.value.startsWith("/")) {
            onSearch(e.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="cmd-shortcuts">
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", alignSelf: "center" }}>
          QUICK COMMANDS:
        </span>
        <button
          className="cmd-chip"
          onClick={() => {
            onFilterTicker("NVDA");
          }}
        >
          /news NVDA
        </button>
        <button
          className="cmd-chip"
          onClick={() => {
            router.push("/company/NVDA");
          }}
        >
          /timeline NVDA
        </button>
        <button
          className="cmd-chip"
          onClick={() => {
            router.push("/company/AAPL");
          }}
        >
          /why AAPL
        </button>
        <button
          className="cmd-chip"
          onClick={() => {
            onFilterTicker("TSLA");
          }}
        >
          /news TSLA
        </button>
        <button
          className="cmd-chip"
          onClick={() => {
            onSetMinImportance(0.8);
          }}
        >
          /alert 0.80
        </button>
        {currentTicker && (
          <button
            className="cmd-chip"
            style={{ color: "var(--bear)", borderColor: "var(--bear)" }}
            onClick={() => {
              onFilterTicker(null);
            }}
          >
            [CLEAR FILTER: {currentTicker}]
          </button>
        )}
      </div>
    </div>
  );
}
