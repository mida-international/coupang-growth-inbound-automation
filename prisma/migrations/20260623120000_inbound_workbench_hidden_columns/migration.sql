-- AlterTable
ALTER TABLE "inbound_workbench_column_layout" ADD COLUMN "hidden_columns" JSONB NOT NULL DEFAULT '[]';
