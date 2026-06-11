-- CreateTable
CREATE TABLE "CoupangSellerAccount" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoupangSellerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoupangSellerAccount_createdById_idx" ON "CoupangSellerAccount"("createdById");

-- CreateIndex
CREATE INDEX "CoupangSellerAccount_createdAt_idx" ON "CoupangSellerAccount"("createdAt");

-- AddForeignKey
ALTER TABLE "CoupangSellerAccount" ADD CONSTRAINT "CoupangSellerAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
