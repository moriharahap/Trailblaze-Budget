CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rarity" integer NOT NULL,
	"path_name" text NOT NULL,
	"element_name" text NOT NULL,
	"element_color" text,
	"icon_path" text NOT NULL,
	"is_trailblazer" boolean DEFAULT false NOT NULL,
	"variant_ids" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_data_cache" (
	"file_key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ok" boolean NOT NULL,
	"source" text,
	"error" text,
	"character_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_meta" (
	"character_id" text PRIMARY KEY NOT NULL,
	"roles" text[] DEFAULT '{}' NOT NULL,
	"generic_score" integer,
	"is_released" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" serial PRIMARY KEY NOT NULL,
	"dps_id" text NOT NULL,
	"rank" integer NOT NULL,
	"title" text NOT NULL,
	"slots" jsonb NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lineups_dps_rank_unique" UNIQUE("dps_id","rank")
);
--> statement-breakpoint
CREATE TABLE "substitutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"dps_id" text NOT NULL,
	"role" text NOT NULL,
	"options" jsonb NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "substitutes_dps_role_unique" UNIQUE("dps_id","role")
);
--> statement-breakpoint
CREATE TABLE "user_ownership" (
	"anon_id" text NOT NULL,
	"character_id" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_ownership_anon_id_character_id_pk" PRIMARY KEY("anon_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "app_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
