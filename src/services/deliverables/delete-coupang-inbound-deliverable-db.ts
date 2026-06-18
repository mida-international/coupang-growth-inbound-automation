type CoupangInboundDeliverableDb = {
  $transaction: (ops: unknown[]) => Promise<unknown>;
  coupangInboundRecord: {
    deleteMany: (args: { where: { batchId: string } }) => Promise<unknown>;
  };
  coupangInboundDeliverable: {
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

export async function deleteCoupangInboundDeliverableFromDb(
  id: string,
  db: CoupangInboundDeliverableDb,
): Promise<void> {
  await db.$transaction([
    db.coupangInboundRecord.deleteMany({
      where: { batchId: id },
    }),
    db.coupangInboundDeliverable.delete({ where: { id } }),
  ]);
}

export type { CoupangInboundDeliverableDb };
