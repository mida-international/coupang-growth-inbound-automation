export type PageTab = {
  title: string;
  href: string;
};

export type PageTabGroup = {
  id: string;
  basePath: string;
  tabs: PageTab[];
};

export const coupangGrowthTabGroup: PageTabGroup = {
  id: "coupang-growth",
  basePath: "/data/coupang-growth",
  tabs: [
    {
      title: "쿠팡 판매자 계정 관리",
      href: "/data/coupang-growth/seller-accounts",
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
  ],
};

export const pageTabGroups: PageTabGroup[] = [
  coupangGrowthTabGroup,
  shoplingDataTabGroup,
  coupangGrowthSyncTabGroup,
  integrationsTabGroup,
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
  return pageTabGroups.find((group) => isPageTabActive(pathname, group.basePath));
}

export function getActivePageTabHref(pathname: string, tabs: PageTab[]) {
  const activeTab = tabs.find((tab) => isPageTabActive(pathname, tab.href));
  return activeTab?.href ?? tabs[0]?.href ?? "";
}
