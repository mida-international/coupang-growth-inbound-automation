import "server-only";

import {
  SHOPLING_PROD_FIELDS,
  SHOPLING_SEARCH_TP,
} from "@/lib/shopling/constants";

export type BuildRequestXmlParams = {
  loginId: string;
  companyId: string;
  apiAuthKey: string;
  startDt: string;
  endDt: string;
  prodFields?: string;
};

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildShoplingRequestXml(params: BuildRequestXmlParams): string {
  const loginId = escapeXmlText(params.loginId);
  const companyId = escapeXmlText(params.companyId);
  const apiAuthKey = escapeXmlText(params.apiAuthKey);
  const prodFields = params.prodFields ?? SHOPLING_PROD_FIELDS;

  return `<?xml version="1.0" encoding="UTF-8"?>
<reqst>
  <apiProdGather>
    <login_id><![CDATA[${loginId}]]></login_id>
    <company_id>${companyId}</company_id>
    <api_auth_key>${apiAuthKey}</api_auth_key>
    <search_tp><![CDATA[${SHOPLING_SEARCH_TP}]]></search_tp>
    <start_dt>${params.startDt}</start_dt>
    <end_dt>${params.endDt}</end_dt>
    <prod_fields><![CDATA[${prodFields}]]></prod_fields>
    <opt_yn><![CDATA[Y]]></opt_yn>
    <attri_yn><![CDATA[N]]></attri_yn>
  </apiProdGather>
</reqst>`;
}
