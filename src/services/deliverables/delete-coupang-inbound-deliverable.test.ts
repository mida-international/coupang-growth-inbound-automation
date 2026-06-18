import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { deleteCoupangInboundDeliverableFromDb } from "@/services/deliverables/delete-coupang-inbound-deliverable-db";

const DELIVERABLE_ID = "deliverable-1";

type DeleteManyArgs = {
  where: { batchId: string };
};

type DeliverableDeleteArgs = {
  where: { id: string };
};

describe("deleteCoupangInboundDeliverableFromDb", () => {
  it("deletes coupang inbound records by batchId before deliverable", async () => {
    const deleteManyCalls: DeleteManyArgs[] = [];
    const deliverableDeleteCalls: DeliverableDeleteArgs[] = [];
    const transactionOps: unknown[] = [];

    const db = {
      $transaction: async (ops: unknown[]) => {
        transactionOps.push(...ops);
        await Promise.all(ops);
      },
      coupangInboundRecord: {
        deleteMany: async (args: DeleteManyArgs) => {
          deleteManyCalls.push(args);
          return { count: 2 };
        },
      },
      coupangInboundDeliverable: {
        delete: async (args: DeliverableDeleteArgs) => {
          deliverableDeleteCalls.push(args);
          return { id: args.where.id };
        },
      },
    };

    await deleteCoupangInboundDeliverableFromDb(DELIVERABLE_ID, db);

    assert.equal(deleteManyCalls.length, 1);
    assert.equal(deleteManyCalls[0]?.where.batchId, DELIVERABLE_ID);
    assert.equal(deliverableDeleteCalls.length, 1);
    assert.equal(deliverableDeleteCalls[0]?.where.id, DELIVERABLE_ID);
    assert.equal(transactionOps.length, 2);
  });
});
