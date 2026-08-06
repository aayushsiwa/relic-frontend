CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relic_collections" (
	"relic_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	CONSTRAINT "relic_collections_relic_id_collection_id_pk" PRIMARY KEY("relic_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "relic_tags" (
	"relic_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "relic_tags_relic_id_tag_id_pk" PRIMARY KEY("relic_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "relics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"url" text,
	"title" text,
	"description" text,
	"note" text,
	"domain" text,
	"preview_image" text,
	"favicon" text,
	"content_type" text DEFAULT 'url' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relic_collections" ADD CONSTRAINT "relic_collections_relic_id_relics_id_fk" FOREIGN KEY ("relic_id") REFERENCES "public"."relics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relic_collections" ADD CONSTRAINT "relic_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relic_tags" ADD CONSTRAINT "relic_tags_relic_id_relics_id_fk" FOREIGN KEY ("relic_id") REFERENCES "public"."relics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relic_tags" ADD CONSTRAINT "relic_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relics" ADD CONSTRAINT "relics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;