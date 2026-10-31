ALTER TABLE "partner_projects" DROP CONSTRAINT "partner_projects_slug_unique";--> statement-breakpoint
CREATE INDEX "audit_logs_entity_entity_id_created_at_index" ON "audit_logs" USING btree ("entity","entity_id","created_at");--> statement-breakpoint
ALTER TABLE "partner_projects" DROP COLUMN "slug";--> statement-breakpoint
-- Projets PTF déjà importés par une version précédente du seed : marqueur d'import posé pour ne pas les recréer
INSERT INTO "settings" ("key", "value") SELECT 'seed.partner_projects', jsonb_build_object('importedAt', now()) WHERE EXISTS (SELECT 1 FROM "partner_projects") ON CONFLICT ("key") DO NOTHING;
