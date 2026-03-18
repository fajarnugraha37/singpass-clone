CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`app_type` text NOT NULL,
	`uen` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`allowed_scopes` text NOT NULL,
	`redirect_uris` text NOT NULL,
	`jwks` text,
	`jwks_uri` text,
	`site_url` text,
	`description` text,
	`support_emails` text,
	`environment` text DEFAULT 'Staging' NOT NULL,
	`agreement_accepted` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `user_account_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`linked_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);