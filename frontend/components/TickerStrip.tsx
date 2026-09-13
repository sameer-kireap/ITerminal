"use client";

import React from "react";

interface TickerData {
  symbol: string;
  price: number;
  change: number;
}

const MOCK_TICKERS: TickerData[] = [
  { symbol: "NVDA", price: 127.45, change: 3.21 },
  { symbol: "AAPL", price: 234.82, change: -0.47 },
  { symbol: "TSLA", price: 248.50, change: 1.83 },
  { symbol: "MSFT", price: 430.15, change: 0.92 },
  { symbol: "GOOGL", price: 177.62, change: -1.15 },
  { symbol: "AMZN", price: 192.38, change: 2.14 },
  { symbol: "META", price: 568.90, change: 0.67 },
  { symbol: "AMD", price: 164.22, change: 4.53 },
  { symbol: "NFLX", price: 712.40, change: -0.28 },
  { symbol: "JPM", price: 218.75, change: 0.35 },
  { symbol: "V", price: 285.30, change: 0.18 },
  { symbol: "CRM", price: 262.85, change: -0.92 },
];

interface TickerStripProps {
  onTickerClick?: (symbol: string) => void;
}

export function TickerStrip({ onTickerClick }: TickerStripProps) {
  const doubled = [...MOCK_TICKERS, ...MOCK_TICKERS];

  return (
    <div className="ticker-strip">
      <div className="ticker-strip-inner">
        {doubled.map((t, i) => {
          const isUp = t.change >= 0;
          return (
            <React.Fragment key={`${t.symbol}-${i}`}>
              <span
                className={`ticker-item ${isUp ? "up" : "down"}`}
                onClick={() => onTickerClick?.(t.symbol)}
              >
                <span className="symbol">{t.symbol}</span>
                <span className="price">${t.price.toFixed(2)}</span>
                <span className="change">
                  {isUp ? "+" : ""}{t.change.toFixed(2)}%
                </span>
              </span>
              {i < doubled.length - 1 && <span className="ticker-divider">│</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
