import type { LucideIcon } from "lucide-react";
import {
  Database,
  Download,
  History,
  Layers,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Plug,
  RefreshCw,
  Settings,
  TrendingUp,
  Upload,
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
};

export type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const mainNavItems: NavItem[] = [
  { title: "대시보드", href: "/", icon: LayoutDashboard },
  { title: "추세 관리", href: "/trends", icon: TrendingUp },
  { title: "엑셀 업로드", href: "/excel-upload", icon: Upload },
  { title: "산출물 다운로드", href: "/downloads", icon: Download },
  { title: "입고 관리하기", href: "/inbound", icon: Download },
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
    { title: "샵플링 정보 관리", href: "/data/shopling", icon: Database },
    { title: "쿠팡 Growth", href: "/data/coupang-growth", icon: TrendingUp },
    { title: "바코드 매핑", href: "/data/barcode-mapping", icon: Link2 },
    { title: "상품 매핑", href: "/data/product-mapping", icon: Layers },
    { title: "패키지 매핑", href: "/data/package-mapping", icon: Layers },
    {
      title: "재고 차감 히스토리",
      href: "/data/inventory-history",
      icon: History,
    },
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
    { title: "연동 가이드", href: "/settings/integration-guide", icon: Plug },
    { title: "샵플링 API", href: "/settings/shopling-api", icon: Settings },
  ],
};
