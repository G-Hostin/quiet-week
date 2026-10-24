# Quiet Week

**Should you move your launch? Quiet Week measures whether the big release next to yours shares your players.**

GTA VI lands on November 19, 2026, and studios are emptying the month around it. But dodging only helps if the big
release has *your* players. Quiet Week answers that question for one indie game, week by week, with Qloo's audience
data: for an action western, GTA's players overlap at **0.90**; for a cozy farming game, **0.55**. Same week, opposite advice.

## Who it is for

Indie studios and small publishers picking a launch week between November 2026 and March 2027. They usually have
one shot at a launch week and today they guess: release calendars count games, but none says whether a big release
shares your audience.

## What it does

1. **Your game.** Type one sentence and 1 to 3 well-known games whose players look like yours. An AI agent finds them
   in Qloo, fixes typos, checks Qloo has audience data for each, and asks you to confirm (with Qloo's cover images).
2. **The calendar.** 21 weeks, one bar each. Height and colour show how much that week's big releases (games *and*
   films) share your players. Click a week to see each release, its score, its stand-in, and the source of its date.
3. **The verdict.** Three weeks that look quiet for you, two to avoid, one plain sentence each, and a box answering
   "Should you dodge GTA VI?" with the number.
4. **The evidence.** Every number links to the exact Qloo call (entity ids and parameters); every date links to its
   public source. Limits are written on screen.

Three examples are precomputed and load instantly: *cozy farming game* (like Stardew Valley), *action western*
(like Red Dead Redemption 2), *metroidvania* (like Hollow Knight).

## How Qloo is used

Base URL `https://hackathon.api.qloo.com`, header `X-Api-Key`, server side only.

| Step | Call |
|---|---|
| Find a game | `GET /search?query=<title>&types=urn:entity:videogame&take=5` |
| Check Qloo has audience data for it | `GET /v2/insights?filter.type=urn:entity:videogame&signal.interests.entities=<id>&filter.results.entities=<4 well-known games>` |
| Score every upcoming game | `GET /v2/insights?filter.type=urn:entity:videogame&signal.interests.entities=<your 1-3 games>&filter.results.entities=<up to 25 release ids>&take=25` |
| Score every upcoming film | same call with `filter.type=urn:entity:movie` |

Qloo returns a `query.affinity` between 0 and 1 for each entity it can score and leaves the others out. A full
analysis takes 4 insights calls (games and films, own entities then stand-ins), about 1 second each.

**Stand-ins.** Qloo does not score games or films before they come out (GTA VI has an entity but no affinity), so
each upcoming release in the calendar declares a stand-in, usually the previous game or film of the series
(GTA V for GTA VI, Metroid Dread for Metroid Ravenous, Dune: Part Two for Dune: Part Three). The release's own score
is always used when Qloo has one (Pikmin 4, Metaphor: ReFantazio, Avengers: Doomsday). The stand-in is named next to
every number it produces.

## The agent

A Gemini model (`gemini-3.5-flash-lite`, falling back to `gemini-3.5-flash`) drives the work through function calling:

- **Resolver tools:** `search_games`, `check_audience_data`, `propose_matches`. It retries with a corrected title
  when a search fails and explains each pick in a short note.
- **Analyst tools:** `get_release_calendar`, `measure_overlap`, `get_stand_ins`, `measure_stand_ins`,
  `build_calendar`, `submit_verdict`.
- **Its steps stream to the screen** as it works (search, check, stand-in, measure, compute, write).
- **It may only quote Qloo's numbers.** `submit_verdict` rejects any decimal not returned by Qloo, any week or date
  the tools did not return, and any word about sales, revenue, wishlists, percentages or forecasts. The agent then
  rewrites; if it still fails, the app shows a verdict assembled from the numbers instead.
- **Privacy.** The model only sees game and film titles, dates and Qloo numbers. Your one-sentence pitch is never
  sent to it. Quiet Week uses Gemini's free tier, so Google may use these requests to improve its models.

The colours and the week picks are computed by plain code (`lib/calendar.ts`), not by the model, so they are
reproducible and tested.

## The colour rule

A week turns **red** when a game released that week has a Qloo affinity of **0.75** or more with your players,
**yellow** from **0.68** (or a film from **0.78**; films never turn a week red), **green** below that, and **grey**
when no tracked release lands that week.

Chosen from the real scores of the three examples: games ranged from 0.44 to 0.90 with half between 0.55 and 0.67,
so 0.68 marks the top quarter and 0.75 the clear outliers. Blockbuster films score 0.63 to 0.81 for every audience
tried, so their score says more about their reach than about a shared niche.

Recommended weeks have no Steam storewide sale or Next Fest and no game at 0.68 or more within two weeks either side.

## The release calendar

`data/releases.json`: 34 releases (23 games, 11 films) from November 2026 to March 2027, plus three Steam events
(Winter Sale, February Next Fest, Spring Sale) from Valve's Steamworks documentation. Every entry was typed by hand
from a public source (publisher site, platform store, press, Cinema United's release calendar) and has its link and
check date. Nothing is scraped. Edit the three source files in `data/` and run `python3 -I scripts/merge-releases.py`.

## Limits

- **Affinity is not sales.** It is Qloo's 0 to 1 score of how much two audiences like the same things, not a share of
  players. Quiet Week makes no sales forecast.
- **Stand-ins are approximations**, and one is a genre stand-in (Graveyard Keeper for Grave Seasons, a new game).
- **Dates move.** They were checked on October 23, 2026.
- **Small games** have little Qloo data, which is why you describe your players with well-known games.
- Football Manager 27 has no score (Qloo does not score its predecessor either).

## Run it locally

```bash
cp .env.example .env.local     # then fill QLOO_API_KEY and GEMINI_API_KEY
npm install
npm run dev                    # http://localhost:3410
npm test                       # unit tests: colour rule, calendar, week picks, stand-ins, agent text check
npm run check:live             # runs the 3 examples end to end against the real APIs
npm run precompute             # regenerates data/examples/*.json
```

Next.js (App Router) and TypeScript, no database. Qloo answers are cached on disk (`.cache/qloo`). Keys stay on
the server (API routes `app/api/resolve` and `app/api/analyze`). Ready for Vercel; on Vercel the cache lives in `/tmp`.

## Licence

MIT. Game and film titles are cited as facts; cover images come from the Qloo API.
