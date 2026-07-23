-- Migration: Remove Hypothesis and Objection (+ ObjectionResponse) models
-- Apply in Neon SQL Editor

DROP TABLE IF EXISTS "ObjectionResponse";
DROP TABLE IF EXISTS "Objection";
DROP TABLE IF EXISTS "Hypothesis";

DROP TYPE IF EXISTS "HypothesisStatus";
DROP TYPE IF EXISTS "HypothesisResult";
