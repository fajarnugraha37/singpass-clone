CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`par_request_uri` text NOT NULL,
	`client_id` text NOT NULL,
	`user_id` text,
	`status` text NOT NULL,
	`otp_code` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `authorization_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`code_challenge` text NOT NULL,
	`dpop_jkt` text NOT NULL,
	`nonce` text,
	`redirect_uri` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
ALTER TABLE `par_requests` ADD `client_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `par_requests` ADD `dpop_jkt` text;--> statement-breakpoint
ALTER TABLE `par_requests` ADD `created_at` integer DEFAULT (strftime('%s', 'now'));--> statement-breakpoint
ALTER TABLE `used_jtis` ADD `client_id` text NOT NULL;