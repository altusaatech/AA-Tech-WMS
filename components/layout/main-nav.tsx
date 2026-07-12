"use client";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, CalendarDays, FolderKanban, SquareKanban, Target, CalendarCheck, CalendarRange, IndianRupee, Compass, Receipt, Sparkles, BookMarked, FileSpreadsheet, Database } from "lucide-react";
import type { Route } from "next";
import { MainNavPill } from "./main-nav-pill";

interface Props {
  activeTasks: number;
  isAdmin: boolean;
  variant?: "drawer";
  /** Render only one half of the nav (used to flank the header status bar). */
  side?: "left" | "right";
}

export function MainNav({ activeTasks, isAdmin, variant, side }: Props) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const dashboardPill = (
    <MainNavPill href={"/" as Route} label="Dashboard" Icon={LayoutDashboard} active={isActive("/")} variant={variant} />
  );
  const myDayPill = (
    <MainNavPill href={"/tasks/agenda" as Route} label="My Day" Icon={CalendarDays} active={isActive("/tasks/agenda")} variant={variant} />
  );
  const tasksPill = (
    <MainNavPill
      href={"/tasks" as Route}
      label="Tasks"
      Icon={ListTodo}
      active={isActive("/tasks") && !pathname.startsWith("/tasks/agenda") && !pathname.startsWith("/tasks/kanban")}
      count={activeTasks}
      variant={variant}
    />
  );
  // Kanban is an admin-only board — hidden from doers.
  const kanbanPill = isAdmin ? (
    <MainNavPill href={"/tasks/kanban" as Route} label="Kanban" Icon={SquareKanban} active={pathname.startsWith("/tasks/kanban")} variant={variant} />
  ) : null;

  // Drawer (mobile): stack them all in one column.
  if (variant === "drawer") {
    return (
      <nav aria-label="Primary" className="flex flex-col gap-1.5 w-full">
        {dashboardPill}
        {myDayPill}
        {tasksPill}
        {kanbanPill}
      </nav>
    );
  }

  const groupClass = "flex items-center gap-1.5 2xl:gap-2";

  // Flank the status bar: Dashboard/My Day on the left, Tasks/Kanban on the right.
  if (side === "left") {
    return (
      <nav aria-label="Primary" className={groupClass}>
        {dashboardPill}
        {myDayPill}
      </nav>
    );
  }
  if (side === "right") {
    return (
      <nav aria-label="Primary" className={groupClass}>
        {tasksPill}
        {kanbanPill}
      </nav>
    );
  }

  // Fallback: all pills on a single centered line.
  return (
    <nav aria-label="Primary" className="flex items-center justify-center gap-1.5 2xl:gap-2">
      {dashboardPill}
      {myDayPill}
      {tasksPill}
      {kanbanPill}
    </nav>
  );
}
