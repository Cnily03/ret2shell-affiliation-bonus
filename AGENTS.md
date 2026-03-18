# affiliation-bonus - Agent Instructions

<project_overview>
You are an expert AI software engineer working on `affiliation-bonus`, an invite-code redemption and team-bonus system.
The stack is Go (Backend) and React + Tailwind CSS v4 + Iconify (Frontend).
Your goal is to provide elegant, optimal, and unconstrained engineering solutions while strictly adhering to the hard constraints below. Skip conversational replies and focus directly on code value.
</project_overview>

<strict_constraints>
1. **Error Responses**: All errors returned by the Go backend must be lowercase `text/plain`. Neither JSON errors nor internal variables (such as SQL errors or memory pointers) are allowed to be leaked.
2. **Testing**: Skip automated code testing after a build. The tests will be performed manually by the user. Do not assume or generate `.spec.ts` or `_test.go` unless explicitly requested.
</strict_constraints>

<system_context>
- **Configuration & Build**: Refer to `config.sample.toml` for the acceptable configuration schema. For backend, build via the `Makefile`. For frontend, build by running `pnpm build` inside the `web/` directory.
- **Data Persistence**: We sync state with a remote PostgreSQL database and a Redis cluster. Always dynamically infer the exact schema formatting by reading structures in the `model/` package and the implemented data access behaviors in `store/`.
- **Styling Paradigm**: The frontend heavily utilizes CSS variables via `@theme inline` in Tailwind CSS v4. Iconify is strictly implemented via `icon-[mdi--xxx]` classes, NEVER via any React `<Icon>` components.
</system_context>

<api_rules>
All RESTful API endpoints are prefixed with `/api/`.
- **Auth Requisite**: Protected endpoints must validate `Authorization: Bearer <JWT>`. Missing or invalid tokens yield `401 unauthorized`.
- **Check Requisite**: Before completing operations in certain endpoints, you must check whether the user has successfully created a team in the `game_id` specified in the config. Failure yields `412 please create a team first`.
</api_rules>

<core_business_logic>
The crux of this project is the **Give Bonus** operation (triggered when redeeming an invite code). It MUST stringently follow these steps:
1. **Bonus Cap**: Grant the invitee's (peer) team `config.bonus_score` points, up to a hard ceiling defined by `config.max_score`.
2. **The Zero-Bonus Invariant**: If the team's score distance to the `max_score` ceiling is `0` points, **YOU MUST ABORT ALL DATABASE INSERTIONS (No writes to the `extra` table)**. Despite dropping the database write, you must successfully append the log of this operation to the Redis cache for logging continuity.
3. **Database Ledger**: If actual points > 0, insert a record into the `extra` database table. The exact formatting for the `reason` string must be: `{peer_user_account}#{peer_user_id} invited {redeem_user_account}#{redeem_user_id}`.
4. **Cache Immutability**: All Redis caching logs regarding "how much points were added" and "who-invited-who" (from both the user's view and the team's view) MUST NOT have any Expiration Time (TTL). These entries are meant to persist forever.
</core_business_logic>

<architectural_guidelines>
- **Backend Cleanliness**: Maintain high modularity (`api/`, `model/`, `service/`, `store/`). Keep external Go module dependencies to an absolute minimum.
- **Frontend Refinement**: In `web/`, prefer functional React 19 components using `useState` and native DOM APIs for things like clipboard copies. Utilize `clsx` sparingly, solely for dynamic conditionals.
- **Independence**: Never wait for explicit file-reads when searching for clues about components—use `grep_search` or AST parsing to figure out interfaces by yourself. Explore the context fearlessly to generate a bulletproof solution in one shot.
</architectural_guidelines>
