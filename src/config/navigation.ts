import type { LucideIcon } from "lucide-react";
import {
  Barcode,
  Bot,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Plug,
  RefreshCw,
  Settings,
  TrendingUp,
  User,
  UserCog,
  Users,
} from "lucide-react";

export const APP_NAME = "미즈코스";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  masterOnly?: boolean;
  external?: boolean;
};

export type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const mainNavItems: NavItem[] = [
  { title: "대시보드", href: "/", icon: LayoutDashboard },
  { title: "산출물 생성", href: "/downloads", icon: FileSpreadsheet },
  { title: "추세조회", href: "/trends", icon: LineChart },
  { title: "자동화", href: "/automation", icon: Bot },
  {
    title: "바코드 출력",
    href: "https://mida-international-label-printer.vercel.app/",
    icon: Barcode,
    external: true,
  },
  { title: "소통 게시판", href: "/board", icon: MessageSquare },
];

export const syncNavGroup: NavGroup = {
  title: "데이터 동기화",
  icon: RefreshCw,
  items: [
    { title: "쿠팡 Growth", href: "/sync/coupang-growth", icon: TrendingUp },
    { title: "샵플링", href: "/sync/shopling", icon: Database },
  ],
};

export const dataNavGroup: NavGroup = {
  title: "데이터 관리",
  icon: Database,
  items: [
    { title: "대시보드", href: "/data/dashboard", icon: LayoutDashboard },
    { title: "쿠팡 Growth", href: "/data/coupang-growth", icon: TrendingUp },
    { title: "샵플링", href: "/data/shopling", icon: Database },
  ],
};

export const settingsNavGroup: NavGroup = {
  title: "설정",
  icon: Settings,
  items: [
    { title: "개인정보", href: "/settings/profile", icon: User },
    { title: "계정 관리", href: "/settings/accounts", icon: Users },
    {
      title: "회원관리",
      href: "/settings/members",
      icon: UserCog,
      masterOnly: true,
    },
    { title: "외부 연동", href: "/integrations", icon: Plug },
  ],
};
