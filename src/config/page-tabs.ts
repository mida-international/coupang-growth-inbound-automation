export type PageTab = {
  title: string;
  href: string;
};

export type PageTabGroup = {
  id: string;
  basePath: string;
  tabs: PageTab[];
};

export const dashboardTabGroup: PageTabGroup = {
  id: "dashboard",
  basePath: "/data/dashboard",
  tabs: [
    {
      title: "창고전송용 입고리스트",
      href: "/data/dashboard/warehouse-inbound",
    },
    {
      title: "샵플링 입고",
      href: "/data/dashboard/shopling-inbound",
    },
  ],
};

export const coupangGrowthTabGroup: PageTabGroup = {
  id: "coupang-growth",
  basePath: "/data/coupang-growth",
  tabs: [
    {
      title: "쿠팡 판매자 계정 관리",
      href: "/data/coupang-growth/seller-accounts",
    },
    {
      title: "재고 현황",
      href: "/data/coupang-growth/inventory-health",
    },
    {
      title: "센터분리 관리",
      href: "/data/coupang-growth/center-separation",
    },
  ],
};

export const coupangGrowthSyncTabGroup: PageTabGroup = {
  id: "coupang-growth-sync",
  basePath: "/sync/coupang-growth",
  tabs: [
    {
      title: "엑셀 업로드",
      href: "/sync/coupang-growth/excel-upload",
    },
  ],
};

export const integrationsTabGroup: PageTabGroup = {
  id: "integrations",
  basePath: "/integrations",
  tabs: [
    {
      title: "샵플링",
      href: "/integrations/shopling",
    },
  ],
};

export const shoplingDataTabGroup: PageTabGroup = {
  id: "shopling-data",
  basePath: "/data/shopling",
  tabs: [
    {
      title: "상품정보",
      href: "/data/shopling/products",
    },
    {
      title: "패키지 매핑",
      href: "/data/shopling/package-mapping",
    },
    {
      title: "신규 옵션 상품",
      href: "/data/shopling/new-option-products",
    },
  ],
};

export const deliverablesTabGroup: PageTabGroup = {
  id: "deliverables",
  basePath: "/downloads",
  tabs: [
    {
      title: "쿠팡 그로스 입고",
      href: "/downloads/coupang-growth-inbound",
    },
    {
      title: "샵플링 입고",
      href: "/downloads/inbound-list",
    },
  ],
};

export const boardWorkflowTabGroup: PageTabGroup = {
  id: "board-workflow",
  basePath: "/board",
  tabs: [
    {
      title: "구 대시보드 작업흐름",
      href: "/board/legacy-dashboard",
    },
  ],
};

export const boardCategoryTabGroup: PageTabGroup = {
  id: "board-category",
  basePath: "/board/legacy-dashboard",
  tabs: [
    {
      title: "전체",
      href: "/board/legacy-dashboard/all",
    },
    {
      title: "공지",
      href: "/board/legacy-dashboard/notice",
    },
    {
      title: "버그/오류",
      href: "/board/legacy-dashboard/bug",
    },
    {
      title: "요청사항",
      href: "/board/legacy-dashboard/request",
    },
    {
      title: "일반",
      href: "/board/legacy-dashboard/general",
    },
  ],
};

/** @deprecated Use boardWorkflowTabGroup or boardCategoryTabGroup */
export const boardTabGroup = boardCategoryTabGroup;

export const pageTabGroups: PageTabGroup[] = [
  dashboardTabGroup,
  coupangGrowthTabGroup,
  shoplingDataTabGroup,
  coupangGrowthSyncTabGroup,
  integrationsTabGroup,
  deliverablesTabGroup,
  boardWorkflowTabGroup,
  boardCategoryTabGroup,
];

export function isPageTabActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getDefaultTabHref(group: PageTabGroup) {
  return group.tabs[0]?.href ?? group.basePath;
}

export function findPageTabGroup(pathname: string) {
  return pageTabGroups
    .filter((group) => isPageTabActive(pathname, group.basePath))
    .sort((a, b) => b.basePath.length - a.basePath.length)[0];
}

export function getActivePageTabHref(pathname: string, tabs: PageTab[]) {
  const activeTab = tabs.find((tab) => isPageTabActive(pathname, tab.href));
  return activeTab?.href ?? tabs[0]?.href ?? "";
}
