CREATE TABLE "game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revealed_pokemon_ids" integer[] NOT NULL,
	"answer_pokemon_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"types" text[] NOT NULL,
	"sprite_url" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_answer_pokemon_id_pokemon_id_fk" FOREIGN KEY ("answer_pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;