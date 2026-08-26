"use client";

import { usePageHeader } from "@/lib/page-header-context";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  usePageHeader({ title, description, action });
  return null;
}