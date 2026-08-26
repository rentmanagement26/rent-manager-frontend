"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface PageHeaderData {
  title: string;
  description: string;
  action?: ReactNode;
}

interface PageHeaderContextValue {
  header: PageHeaderData | null;
  setHeader: (header: PageHeaderData | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderData | null>(null);
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(data: PageHeaderData) {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used within a PageHeaderProvider");

  useEffect(() => {
    ctx.setHeader(data);
    return () => ctx.setHeader(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.title, data.description, data.action]);
}

export function usePageHeaderValue() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeaderValue must be used within a PageHeaderProvider");
  return ctx.header;
}