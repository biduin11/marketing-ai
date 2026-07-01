-- Migration: Add InboxSignal model and enums
-- Apply in Neon SQL Editor

CREATE TYPE "SignalType" AS ENUM (
  'ANOMALY', 'MARKET', 'STRATEGY', 'CONTENT', 'COMPETITOR', 'EXPERIMENT', 'SYSTEM'
);

CREATE TYPE "SignalPriority" AS ENUM (
  'HIGH', 'MEDIUM', 'LOW'
);

CREATE TABLE "InboxSignal" (
  "id"          TEXT NOT NULL,
  "projectId"   TEXT NOT NULL,
  "type"        "SignalType" NOT NULL,
  "priority"    "SignalPriority" NOT NULL DEFAULT 'MEDIUM',
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "action"      TEXT,
  "actionHref"  TEXT,
  "read"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InboxSignal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InboxSignal"
  ADD CONSTRAINT "InboxSignal_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "InboxSignal_projectId_read_idx" ON "InboxSignal"("projectId", "read");
