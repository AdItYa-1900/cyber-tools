# Deploying Sutra on Vercel

The 37 reference and analysis tools are static and work on Vercel with no
setup. The **Investigative Tracer Link** is the one tool that needs a
backend, because it has to receive callbacks from a suspect's device and
remember them between requests.

Vercel is serverless, so there is no long-running `serve.py` and no disk
to write a log file to. This project therefore ships the tracer as four
Vercel functions (in `api/`) backed by a small key–value store. Wiring
that store up is a two-minute, one-time job.

## 1. Deploy the project

Push this folder to a Git repo and import it into Vercel, or run
`vercel` from the folder. The `vercel.json` here routes the tracer:

    /t/new        -> api/new       mint a link
    /t/c/<token>  -> api/c         the landing page you send
    /t/log/<token>-> api/log       the device reports back
    /t/hits/<token>-> api/hits     you read what came back

At this point the app loads and links generate, but **reading visits
fails** — there is nowhere to store them yet. The tracer tool will say
"the tracer needs a store".

## 2. Add a KV store (this is the missing piece)

In your Vercel project:

1. Open the **Storage** tab.
2. Create a database — choose **Upstash Redis** (Vercel's KV). The free
   plan is ample for casework.
3. When it asks, **connect it to this project**. Vercel injects the
   credentials automatically as environment variables
   (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, or the `UPSTASH_REDIS_...`
   pair). You do not copy anything by hand.

## 3. Redeploy

Trigger a redeploy so the functions pick up the new environment
variables (Deployments → the latest → Redeploy).

Open the tracer tool again. The status line should turn green:
**"Capture server is running."** Make a link, open it in another browser,
and press **Check who opened the link** — the visit appears.

## What is captured, and what is not

IP address, user-agent, exact time, language, and the device's screen and
timezone — all of which any web request already exposes. Location only if
the person taps the button and grants the browser's own prompt. **No
camera. No microphone.** Every visit is stored in full for disclosure.

Visits are kept in the store for 30 days by default
(`TRACER_TTL_SECONDS`), then dropped. Export what a case needs into the
case file; the store is working memory, not an archive.

## Put it behind your access control

Anyone who can open the site can mint tracer links. Deploy it behind your
unit's authentication (Vercel's password protection, SSO, or an
IP allow-list) so only verified officers reach it.

## Prefer to run a normal server instead?

If you would rather not use serverless, any host that runs a persistent
process works with **no KV store** — the single-file `serve.py` serves the
app and the tracer together and logs to `canary_log.jsonl` on disk:

    python serve.py     # honours $PORT, binds 0.0.0.0

Render, Railway, Fly.io or a plain VPS all run it directly. Put HTTPS in
front (required for the location prompt to work at all).
