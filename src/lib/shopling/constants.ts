export const SHOPLING_PROD_GATHER_URL =
  "https://api.shopling.co.kr/prod/prod_gather_api.phtml?mode=2";

export const SHOPLING_SEARCH_TP = "등록일";

export const SHOPLING_PROD_FIELDS =
  "ptn_goods_cd,prod_nm,sale_status,goods_tp";

export const SHOPLING_PROD_FIELDS_SYNC =
  "goods_key,ptn_goods_cd,prod_nm,sale_status,goods_tp";

/** 확인용 1회 동기화 구간 (커밋 4b에서 청크 루프로 확장) */
export const SHOPLING_SYNC_VERIFY_START_YMD = "20220401";
export const SHOPLING_SYNC_VERIFY_END_YMD = "20220630";
