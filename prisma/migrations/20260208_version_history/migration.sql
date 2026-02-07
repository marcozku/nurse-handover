-- CreateTable: PatientVersion
CREATE TABLE "patient_versions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "shift" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HandoverVersion
CREATE TABLE "handover_versions" (
    "id" TEXT NOT NULL,
    "handover_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "shift" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserSettings
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "show_version_history" BOOLEAN NOT NULL DEFAULT true,
    "show_shift_colors" BOOLEAN NOT NULL DEFAULT true,
    "highlight_changes" BOOLEAN NOT NULL DEFAULT true,
    "compact_mode" BOOLEAN NOT NULL DEFAULT false,
    "notify_on_changes" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_versions_patient_id_created_at_idx" ON "patient_versions"("patient_id", "created_at");

-- CreateIndex
CREATE INDEX "handover_versions_handover_id_created_at_idx" ON "handover_versions"("handover_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- AddForeignKey
ALTER TABLE "patient_versions" ADD CONSTRAINT "patient_versions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_versions" ADD CONSTRAINT "handover_versions_handover_id_fkey" FOREIGN KEY ("handover_id") REFERENCES "handovers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
