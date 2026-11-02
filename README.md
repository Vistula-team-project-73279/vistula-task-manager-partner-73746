# Task Manager

Team Project – IT, Practical Assignment 1. Student ID: **73746**.

## Links

- Application: https://vistula-team-project-73746.github.io/vistula-task-manager/
- Repository: https://github.com/vistula-team-project-73746/vistula-task-manager
- Contributor page (available after partner PR is merged): https://vistula-team-project-73746.github.io/vistula-task-manager/contribution.html
- Contributor JSON (available after partner PR is merged): https://vistula-team-project-73746.github.io/vistula-task-manager/contribution.json

## Functionality

Display, create, edit, complete/uncomplete and delete tasks. Tasks are stored in Supabase PostgreSQL and survive page refreshes. Edit retrieves the current task by ID. The frontend uses fetch with Supabase REST GET, POST, PATCH and DELETE operations. Text is rendered using textContent.

## Setup

1. Create a separate free Supabase demonstration project with the Data API enabled.
2. Run `setup.sql` once in its SQL Editor. This creates the required table and public CRUD policies with RLS enabled.
3. Fill `supabaseUrl` and `supabasePublishableKey` in `config.json`. Use only the `sb_publishable_...` key. Keep `tableName` as `tasks`. Never commit database passwords or secret/service-role keys.
4. Publish GitHub Pages from the `main` branch, `/ (root)`.
5. Test the deployed site: add a test task, refresh, edit both fields, mark complete/incomplete, delete, refresh again. Check error messages with the network unavailable.

This is a public classroom demonstration. Visitors can read and change all tasks. Store test data only.

## Team collaboration — pending

- Outgoing Pull Request: https://github.com/RaufJumshudov73279/vistula-task-manager/pull/1 — **open; awaiting partner review and merge**.
- Incoming Pull Request from student **73279**: **pending; partner must submit it from their own account**.
- Partner repository: https://github.com/RaufJumshudov73279/vistula-task-manager

A different student must add `contribution.html` and `contribution.json` to this repository through their own Pull Request. Their JSON must contain their student ID. The repository owner reviews and merges that PR. Student 73746 must also fork the partner's repository and contribute those two files there, with contributorStudentId set to 73746, via a PR that the partner merges.

The contribution page must have the heading Team Contribution, button `load-contributor` (Show Contributor), an element `contributor-student-id`, and a link to `index.html`. Clicking the button must fetch `contribution.json` and display its contributorStudentId value. The partner should keep any JavaScript inside that HTML file so the contribution consists of exactly two files.

Both PR links must replace the pending entries above before submission. Submit only the main application URL in Platon after both parts work.
