import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  htmlContainsShoplingLoginForm,
  htmlMatchesAnySelector,
  isShoplingSessionExpiredError,
  isShoplingWmsLoginUrl,
  SHOPLING_SESSION_EXPIRED_MESSAGE,
} from "@/lib/shopling-wms/browser/shopling-auth";
import { INVENTORY_SEARCH_FRAME_SELECTORS } from "@/lib/shopling-wms/negative-stock/inventory-search-form";

const LOGIN_HTML = `
<html>
  <body>
    <form>
      <input type="text" id="login_id" name="login_id" />
      <input type="password" id="login_pw" name="login_pw" />
    </form>
  </body>
</html>
`;

const INVENTORY_SEARCH_HTML = `
<html>
  <body>
    <form>
      <input type="text" id="srch_opt_s_cnt" name="srch_opt_s_cnt" />
      <input type="text" id="srch_opt_e_cnt" name="srch_opt_e_cnt" />
      <select name="srch_opt_cnt"><option value="A">가용재고</option></select>
      <input type="button" value="검색" />
      <input type="button" value="EXCEL 저장" onclick="stock_excel_save();" />
    </form>
  </body>
</html>
`;

describe("isShoplingWmsLoginUrl", () => {
  it("detects login page URLs", () => {
    assert.equal(
      isShoplingWmsLoginUrl("https://a.shopling.co.kr/login.phtml"),
      true,
    );
    assert.equal(
      isShoplingWmsLoginUrl(
        "https://a.shopling.co.kr/invntryn/goods_inventory_list.phtml",
      ),
      false,
    );
  });
});

describe("htmlContainsShoplingLoginForm", () => {
  it("returns true for login form HTML", () => {
    assert.equal(htmlContainsShoplingLoginForm(LOGIN_HTML), true);
  });

  it("returns false for inventory search HTML", () => {
    assert.equal(htmlContainsShoplingLoginForm(INVENTORY_SEARCH_HTML), false);
  });
});

describe("htmlMatchesAnySelector", () => {
  it("matches inventory search anchors", () => {
    assert.equal(
      htmlMatchesAnySelector(
        INVENTORY_SEARCH_HTML,
        INVENTORY_SEARCH_FRAME_SELECTORS,
      ),
      true,
    );
  });

  it("does not match login HTML with inventory selectors", () => {
    assert.equal(
      htmlMatchesAnySelector(LOGIN_HTML, INVENTORY_SEARCH_FRAME_SELECTORS),
      false,
    );
  });
});

describe("isShoplingSessionExpiredError", () => {
  it("detects session expiry messages", () => {
    assert.equal(
      isShoplingSessionExpiredError(SHOPLING_SESSION_EXPIRED_MESSAGE),
      true,
    );
    assert.equal(
      isShoplingSessionExpiredError("샵플링 WMS 로그인이 필요합니다."),
      true,
    );
    assert.equal(
      isShoplingSessionExpiredError("재고 화면 요소를 찾을 수 없습니다."),
      false,
    );
  });
});
