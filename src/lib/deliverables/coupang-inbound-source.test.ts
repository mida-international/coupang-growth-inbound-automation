import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeSourceFingerprint,
  parseCoupangInboundSourceFiles,
} from "@/lib/deliverables/coupang-inbound-source";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

describe("computeSourceFingerprint", () => {
  it("returns the same fingerprint regardless of file order", () => {
    assert.equal(
      computeSourceFingerprint([HASH_A, HASH_B]),
      computeSourceFingerprint([HASH_B, HASH_A]),
    );
  });

  it("returns different fingerprints for different file sets", () => {
    assert.notEqual(
      computeSourceFingerprint([HASH_A]),
      computeSourceFingerprint([HASH_A, HASH_B]),
    );
  });

  it("returns null when no valid hash is given", () => {
    assert.equal(computeSourceFingerprint([]), null);
    assert.equal(computeSourceFingerprint(["not-a-hash"]), null);
  });
});

describe("parseCoupangInboundSourceFiles", () => {
  it("reads stored entries and skips malformed ones", () => {
    const files = parseCoupangInboundSourceFiles([
      {
        name: "box.xlsx",
        sha256: HASH_A,
        contentType: "application/vnd.ms-excel",
        size: 10,
        storagePath: "coupang-inbound-deliverables/x/source-0.xlsx",
      },
      { name: "photo.jpg", sha256: HASH_B },
      { sha256: HASH_B },
      null,
    ]);

    assert.equal(files.length, 2);
    assert.equal(files[0].storagePath, "coupang-inbound-deliverables/x/source-0.xlsx");
    assert.equal(files[1].contentType, null);
    assert.equal(files[1].storagePath, null);
  });

  it("returns an empty list for non-array values", () => {
    assert.deepEqual(parseCoupangInboundSourceFiles(null), []);
  });
});
