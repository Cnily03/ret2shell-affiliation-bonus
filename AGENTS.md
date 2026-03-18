# invite-bonus - Agent Instructions

<project_overview>
You are an expert AI software engineer working on `invite-bonus`, an invite-code redemption and team-bonus system.
The stack is Go (Backend) and React + Tailwind CSS v4 + Iconify (Frontend).
Your goal is to provide elegant, optimal, and unconstrained engineering solutions while strictly adhering to the hard constraints below. Skip conversational replies and focus directly on code value.
</project_overview>

<strict_constraints>
1. **Error Responses**: All errors returned by the Go backend must be lowercase `text/plain`. Neither JSON errors nor internal variables (such as SQL errors or memory pointers) are allowed to be leaked.
2. **Testing**: Skip automated code testing after a build. The tests will be performed manually by the user. Do not assume or generate `.spec.ts` or `_test.go` unless explicitly requested.
</strict_constraints>

<system_context>
- **Configuration & Build**: Refer to `config.sample.toml` for the acceptable configuration schema. For backend, build via the `Makefile`. For frontend, build by running `pnpm build` inside the `web/` directory.
- **Data Persistence**: We sync state with two PostgreSQL databases: `r2sDB` (the Ret2Shell platform database, read-heavy with a few specific writes) and `appDB` (this project's own database for invite codes and redeem records). Redis is strictly NOT used. Always dynamically infer the exact schema formatting by reading structures in the `model/` package, `service/ret2shell.go`, `store/r2sdb.go` and `store/appdb.go`.
- **Styling Paradigm**: The frontend heavily utilizes CSS variables via `@theme inline` in Tailwind CSS v4. Iconify is strictly implemented via `icon-[mdi--xxx]` classes, NEVER via any React `<Icon>` components.
</system_context>

<api_rules>
All RESTful API endpoints are prefixed with `/api/`.
- **Auth Requisite**: Protected endpoints must validate `Authorization: Bearer <JWT>`. Missing or invalid tokens yield `401 unauthorized`.
- **Check Requisite**: Before completing operations in certain endpoints, you must check whether the user has successfully created a team in the `game_id` specified in the config. Failure yields error with `please create a team first`.
</api_rules>

<core_business_logic>
The crux of this project is the **Give Bonus** operation (triggered when redeeming an invite code). It MUST stringently follow these steps:
1. **Bonus Cap**: Grant the invitee's (peer) team `config.bonus_score` points, up to a hard ceiling defined by `config.max_score`.
2. **The Zero-Bonus Invariant**: If the team's score distance to the `max_score` ceiling is `0` points, **YOU MUST ABORT insertions into `extra` and `team` updates on r2sDB**, but you still must successfully record the operation into the `redeem_record` table on appDB for logging continuity.
3. **Database Ledger**: If actual points > 0, insert a record into the `extra` table and update the `team` table on `r2sDB`. The exact formatting for the `reason` string must be: `{peer_user_account}#{peer_user_id} invited {redeem_user_account}#{redeem_user_id}`.
4. **Permanent Logging**: Always add a log to the `redeem_record` table in `appDB` during redemption. This table replaces what used to be a cache log and tracks "who-invited-who" immutably.
</core_business_logic>

<architectural_guidelines>
- **Backend Cleanliness**: Maintain high modularity (`api/`, `model/`, `service/`, `store/`). Keep external Go module dependencies to an absolute minimum. R2S DB operations should be fully encapsulated in `service/ret2shell.go`.
- **Frontend Refinement**: In `web/`, prefer functional React 19 components using `useState` and native DOM APIs for things like clipboard copies. Utilize `clsx` sparingly, solely for dynamic conditionals.
- **Independence**: Never wait for explicit file-reads when searching for clues about components—use `grep_search` or AST parsing to figure out interfaces by yourself. Explore the context fearlessly to generate a bulletproof solution in one shot.
</architectural_guidelines>
