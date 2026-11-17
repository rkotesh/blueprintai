"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Monitor, Cpu, Database, ShieldCheck, Globe } from "lucide-react";

export interface ArchitectureNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  layer: "frontend" | "backend" | "database" | "auth" | "external";
  description: string;
  tech: string;
  isActiveTrace?: boolean;
}

const layerConfig: Record<
  ArchitectureNodeData["layer"],
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }
> = {
  frontend: {
    bg: "bg-emerald-500/10 dark:bg-emerald-950/30",
    border: "border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    icon: Monitor,
    title: "Frontend Layer",
  },
  backend: {
    bg: "bg-blue-500/10 dark:bg-blue-950/30",
    border: "border-blue-500/40",
    text: "text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    icon: Cpu,
    title: "Backend Layer",
  },
  database: {
    bg: "bg-amber-500/10 dark:bg-amber-950/30",
    border: "border-amber-500/40",
    text: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    icon: Database,
    title: "Database Layer",
  },
  auth: {
    bg: "bg-purple-500/10 dark:bg-purple-950/30",
    border: "border-purple-500/40",
    text: "text-purple-700 dark:text-purple-300",
    badgeBg: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
    icon: ShieldCheck,
    title: "Auth Security Layer",
  },
  external: {
    bg: "bg-rose-500/10 dark:bg-rose-950/30",
    border: "border-rose-500/40",
    text: "text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
    icon: Globe,
    title: "External Service",
  },
};

function ArchitectureNodeComponent({ data, selected }: { data: ArchitectureNodeData; selected?: boolean }) {
  const cfg = layerConfig[data.layer] || layerConfig.backend;
  const Icon = cfg.icon;

  return (
    <div
      className={`relative min-w-[220px] max-w-[260px] rounded-xl border-2 p-4 transition-all duration-200 shadow-md ${
        cfg.bg
      } ${cfg.border} ${
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      } ${
        data.isActiveTrace
          ? "ring-4 ring-primary animate-pulse shadow-xl shadow-primary/20 scale-105"
          : "hover:shadow-lg"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-primary" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-primary" />
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-primary" id="top" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-primary" id="bottom" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${cfg.badgeBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
          {data.layer}
        </span>
      </div>

      <div className="space-y-1">
        <div className="font-semibold text-sm text-foreground leading-snug">{data.label}</div>
        <div className="text-xs text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded border inline-block">
          {data.tech}
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
        {data.description}
      </div>

      {data.isActiveTrace && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>Active Action Step</span>
        </div>
      )}
    </div>
  );
}

export default memo(ArchitectureNodeComponent);
