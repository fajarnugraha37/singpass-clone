CREATE TABLE `qr_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text(255) NOT NULL,
	`nonce` text(255) NOT NULL,
	`request_uri` text(1024) NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`auth_code` text(2048),
	`id_token` text,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
