CREATE TABLE "replay" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"replay_url" text NOT NULL,
	"format" text NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "replay_replay_url_unique" UNIQUE("replay_url")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"replay_id" uuid NOT NULL,
	"player" text NOT NULL,
	"pokemon_ids" integer[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_replay_id_replay_id_fk" FOREIGN KEY ("replay_id") REFERENCES "public"."replay"("id") ON DELETE no action ON UPDATE no action;