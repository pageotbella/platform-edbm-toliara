CREATE TABLE "partner_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(220) NOT NULL,
	"title" varchar(200) NOT NULL,
	"full_name" varchar(300),
	"donor" varchar(200) NOT NULL,
	"implementer" text,
	"sectors" text,
	"duration" text,
	"start_year" integer,
	"end_year" integer,
	"funding" text,
	"amount_usd" numeric(18, 2),
	"beneficiaries" text,
	"contact" text,
	"source" text,
	"notes" text,
	"region_id" uuid NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "partner_projects" ADD CONSTRAINT "partner_projects_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_projects" ADD CONSTRAINT "partner_projects_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_projects_region_id_index" ON "partner_projects" USING btree ("region_id");