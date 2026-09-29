import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPreviewWriteBlocked } from "@/lib/api/preview-write-guard";

function blocked(vercelEnv: string | undefined, method: string, pathname: string) {
  return isPreviewWriteBlocked({ vercelEnv, method, pathname });
}

describe("isPreviewWriteBlocked", () => {
  it("blocks writes on preview (records, deletes, sheet pushes)", () => {
    assert.equal(blocked("preview", "POST", "/api/warehouse-inbound-deliverables"), true);
    assert.equal(blocked("preview", "POST", "/api/coupang-inbound-deliverables"), true);
    assert.equal(blocked("preview", "DELETE", "/api/coupang-inbound-deliverables/abc"), true);
    assert.equal(blocked("preview", "POST", "/api/downloads/inbound-trends/date-column-to-sheet"), true);
    assert.equal(blocked("preview", "POST", "/api/downloads/warehouse-inbound-list/google-sheets"), true);
  });

  it("allows read-only file generation and checks on preview", () => {
    assert.equal(blocked("preview", "POST", "/api/downloads/coupang-inbound-template"), false);
    assert.equal(blocked("preview", "POST", "/api/coupang-inbound-deliverables/check-duplicates"), false);
    assert.equal(blocked("preview", "POST", "/api/vision/extract-box-list"), false);
    assert.equal(blocked("preview", "GET", "/api/downloads/inbound-workbench"), false);
  });

  it("never blocks production or local", () => {
    assert.equal(blocked("production", "POST", "/api/warehouse-inbound-deliverables"), false);
    assert.equal(blocked(undefined, "DELETE", "/api/coupang-inbound-deliverables/abc"), false);
  });

  it("does not touch pages", () => {
    assert.equal(blocked("preview", "POST", "/login"), false);
  });
});
