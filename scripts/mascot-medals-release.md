# Mascot medals release

The migration is additive and starts with the launch timestamp unset. Existing actions and historical leaderboards never backfill progress.

1. Run the database migration `20260915110000_mascot_medals.sql`.
2. Deploy the application to Vercel production and wait for READY.
3. Execute `supabase db query --linked --file scripts/activate-mascot-medals.sql`.
4. Verify `mascot_medal_launch.launched_at`, nine applied fiscal allocations, and empty care/game counters.

Activation and the approved fiscal allocations commit together. The allocation function locks each mascot and records the actual deduction and before/after phases. Repeating the operation never deducts twice. The launch timestamp does not change on subsequent releases.

The first entry presents the medals introduction, followed by the fiscal receipt. Seen flags and the three featured medals belong to the account, not the device. A missing mascot at launch receives neither witness nor fiscal event medals later.

Care uses atomic server RPCs. Rejected care does not count. Care streaks and distinct game days use Europe/Rome dates. Full maintenance requires a new transition to three full bars. New game runs are registered at start and completed once by UUID; a repeated completion cannot change the run. Medal podiums have separate new-season standings and preserve earned trophies.

Art: `ullatenente-di-ritorno.png` is the supplied filename. `non-era-un-coniglio.png` completes the supplied artwork collection.

Validation: TypeScript, production build, targeted ESLint, game reward/evolution/grill tests, and SQL regression checks in a rolled-back transaction. `supabase/tests/mascot_medals.sql` must run inside a disposable/rolled-back transaction with the migration loaded and launch unset; never run it standalone on the active release.

## Rehabilitation medal

`20260915120000_grill_rehabilitation_medal.sql` replaces the unused clean-record award with `riabilitato-alla-brace`, reusing its PNG. It requires ten completed grill runs started after that account's fiscal allocation was applied. Only runs already tracked in the new ledger are eligible. Completion triggers and UUID idempotency prevent repeated submissions from incrementing it twice. No XP, launch dates or other counters are reset.

The mascot page and its dialogs reserve the safe-area insets on all four edges for notched devices.

## Current leaderboard awards

`20260915150000_award_existing_game_podiums.sql` grants the top three medals from each existing leaderboard as explicitly requested. The assignment is preserved in `mascot_podium_snapshot_20260915`; ties follow the visible leaderboards (score descending, user UUID ascending). Existing earned medals keep their original dates, and no care/game counters or XP are changed. Future new-season medal rules are unchanged.

Rival sheets use a compact medal ribbon. It displays the owner's featured medals or, when none are selected, up to three most recently earned medals. The full catalog remains accessible through “Vedi tutti”.
