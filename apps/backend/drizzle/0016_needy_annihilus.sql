ALTER TABLE `sessions` ADD `client_id` text REFERENCES clients(id);--> statement-breakpoint
ALTER TABLE `sessions` ADD `scopes` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `created_at` integer DEFAULT (strftime('%s', 'now'));