CREATE TABLE `auth_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`session_id` text NOT NULL,
	`par_id` integer NOT NULL,
	`code_challenge` text NOT NULL,
	`code_challenge_method` text DEFAULT 'S256' NOT NULL,
	`dpop_jkt` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`par_id`) REFERENCES `par_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_codes_code_unique` ON `auth_codes` (`code`);--> statement-breakpoint
CREATE TABLE `par_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_uri` text NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `par_requests_request_uri_unique` ON `par_requests` (`request_uri`);--> statement-breakpoint
CREATE TABLE `security_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`severity` text NOT NULL,
	`details` text,
	`client_id` text,
	`ip_address` text,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `server_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`encrypted_key` text NOT NULL,
	`iv` text NOT NULL,
	`auth_tag` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`dpop_jkt` text,
	`loa` integer DEFAULT 0 NOT NULL,
	`is_authenticated` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`nric` text,
	`name` text NOT NULL,
	`email` text,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_nric_unique` ON `users` (`nric`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);