"use client";

import { useState } from "react";

export function HeroShowcase() {
  const [activeTab, setActiveTab] = useState<"properties" | "leases" | "payments">("properties");

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Soft Ambient Glow */}
      <div className="absolute -top-10 -right-10 -z-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 -z-10 h-64 w-64 rounded-full bg-accent-dark/10 blur-3xl" />

      {/* Main Dashboard Window */}
      <div className="relative rounded-2xl border border-default bg-surface shadow-xl overflow-hidden">
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-subtle bg-subtle/60">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>

          <div className="px-3 py-0.5 rounded-md bg-surface border border-default text-[11px] font-mono text-muted">
            app.domuspro.ca
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                activeTab === "properties" ? "bg-accent text-white" : "text-body hover:bg-subtle"
              }`}
            >
              Units
            </button>
            <button
              onClick={() => setActiveTab("leases")}
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                activeTab === "leases" ? "bg-accent text-white" : "text-body hover:bg-subtle"
              }`}
            >
              Leases
            </button>
          </div>
        </div>

        {/* Dashboard Inner Body */}
        <div className="p-5 space-y-4 text-left">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Portfolio</span>
              <h3 className="text-base font-bold text-heading">Mississauga Properties</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              ● 100% Occupancy
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-subtle border border-default">
              <span className="text-[10px] text-muted block">August Rent</span>
              <span className="text-sm font-bold text-heading">$18,450</span>
            </div>
            <div className="p-2.5 rounded-xl bg-subtle border border-default">
              <span className="text-[10px] text-muted block">Standard Leases</span>
              <span className="text-sm font-bold text-heading">8 Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-subtle border border-default">
              <span className="text-[10px] text-muted block">Rent Status</span>
              <span className="text-sm font-bold text-green-600">On Time</span>
            </div>
          </div>

          {/* Unit Rows */}
          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl border border-subtle bg-subtle/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-tint text-accent-dark font-bold flex items-center justify-center text-xs">
                  1A
                </div>
                <div>
                  <div className="text-xs font-semibold text-heading">5496 Gorvan Dr • Unit 1</div>
                  <div className="text-[11px] text-muted">Sarah Jenkins</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-heading">$2,200/mo</div>
                <div className="text-[10px] text-green-600 font-medium">Paid (e-Transfer)</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-subtle bg-subtle/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-subtle text-body font-bold flex items-center justify-center text-xs">
                  2B
                </div>
                <div>
                  <div className="text-xs font-semibold text-heading">5496 Gorvan Dr • Unit 2</div>
                  <div className="text-[11px] text-muted">Michael Chang</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-heading">$2,450/mo</div>
                <div className="text-[10px] text-green-600 font-medium">Paid (PAD)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge 1: Ontario Standard Lease (Top Right) */}
      <div className="absolute -top-4 -right-2 sm:-right-4 rounded-xl border border-default bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-md flex items-center gap-2.5">
        <span className="text-base">📄</span>
        <div className="text-left">
          <div className="text-xs font-bold text-heading">Ontario Standard Lease</div>
          <div className="text-[10px] text-green-600 font-semibold">✓ Compliant &amp; Signed</div>
        </div>
      </div>

      {/* Floating Badge 2: Payment Received (Bottom Left) */}
      <div className="absolute -bottom-4 -left-2 sm:-left-4 rounded-xl border border-default bg-surface/95 px-3 py-2 shadow-lg backdrop-blur-md flex items-center gap-2.5">
        <span className="text-base">💰</span>
        <div className="text-left">
          <div className="text-xs font-bold text-heading">+$2,200 Received</div>
          <div className="text-[10px] text-muted">Auto-Reconciled</div>
        </div>
      </div>
    </div>
  );
}
