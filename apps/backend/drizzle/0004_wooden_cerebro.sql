CREATE TABLE `myinfo_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `auth_codes`;--> statement-breakpoint
ALTER TABLE `access_tokens` ADD `loa` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `access_tokens` ADD `amr` text;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `loa` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `amr` text;--> statement-breakpoint
ALTER TABLE `authorization_codes` ADD `loa` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `authorization_codes` ADD `amr` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `amr` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` text;