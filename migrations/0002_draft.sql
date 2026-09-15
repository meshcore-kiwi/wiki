-- A draft is one contributor's in-progress changeset: a branch off main that
-- can touch several pages before it becomes a single PR.
create table "draft" (
	"id" text not null primary key,
	"userId" text not null references "user" ("id") on delete cascade,
	"branch" text not null unique,
	"title" text,
	"prNumber" integer,
	-- open | submitted | merged | closed
	"status" text not null default 'open',
	"createdAt" date not null,
	"updatedAt" date not null
);

create index "draft_userId_idx" on "draft" ("userId");
create index "draft_status_idx" on "draft" ("status");
