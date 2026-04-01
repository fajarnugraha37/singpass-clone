ALTER TABLE `qr_sessions` RENAME COLUMN "dpop_key" TO "parent_session_id";--> statement-breakpoint
ALTER TABLE `qr_sessions` ADD `client_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `qr_sessions` ADD `dpop_jkt` text;--> statement-breakpoint
ALTER TABLE `users` ADD `uen` text;