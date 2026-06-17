import { prisma } from "@/lib/db";
import {
  getDefaultColumnLayout,
  normalizeColumnLayout,
  type InboundWorkbenchColumnLayout,
} from "@/services/inbound-workbench/inbound-workbench-column-layout";

export async function getInboundWorkbenchColumnLayout(
  profileId: string,
): Promise<InboundWorkbenchColumnLayout> {
  const record = await prisma.inboundWorkbenchColumnLayout.findUnique({
    where: { profileId },
  });

  if (!record) {
    return getDefaultColumnLayout();
  }

  return normalizeColumnLayout({
    columnOrder: record.columnOrder as InboundWorkbenchColumnLayout["columnOrder"],
    columnWidths: record.columnWidths as InboundWorkbenchColumnLayout["columnWidths"],
  });
}

export async function upsertInboundWorkbenchColumnLayout(
  profileId: string,
  layout: InboundWorkbenchColumnLayout,
): Promise<InboundWorkbenchColumnLayout> {
  const normalized = normalizeColumnLayout(layout);

  await prisma.inboundWorkbenchColumnLayout.upsert({
    where: { profileId },
    create: {
      profileId,
      columnOrder: normalized.columnOrder,
      columnWidths: normalized.columnWidths,
    },
    update: {
      columnOrder: normalized.columnOrder,
      columnWidths: normalized.columnWidths,
    },
  });

  return normalized;
}
