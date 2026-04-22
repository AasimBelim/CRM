ALTER TABLE "leads" ADD COLUMN "created_by" integer NOT NULL DEFAULT 5;
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "leads" ALTER COLUMN "created_by" DROP DEFAULT;