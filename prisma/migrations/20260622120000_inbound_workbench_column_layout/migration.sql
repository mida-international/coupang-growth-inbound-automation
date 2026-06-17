-- CreateTable
CREATE TABLE "inbound_workbench_column_layout" (
    "profile_id" TEXT NOT NULL,
    "column_order" JSONB NOT NULL,
    "column_widths" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbound_workbench_column_layout_pkey" PRIMARY KEY ("profile_id")
);

-- AddForeignKey
ALTER TABLE "inbound_workbench_column_layout" ADD CONSTRAINT "inbound_workbench_column_layout_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
