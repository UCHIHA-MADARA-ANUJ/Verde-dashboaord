# GitHub + Vercel Deployment Checklist

## Files That Must NOT Be Committed
- `.env.local`
- `.env`
- any service role key
- any GitHub token

The repo already includes `.gitignore` to block local env files.

## Vercel Environment Variables
Add these in Vercel Project Settings -> Environment Variables:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VERDE_USER_ID
NEXT_PUBLIC_VERDE_NODE_ID
NEXT_PUBLIC_VERDE_NODE_SLUG
SUPABASE_SERVICE_ROLE_KEY
VERDE_NODE_API_KEY
PLANT_ID_API_KEY
GEMINI_API_KEY
OPENWEATHER_API_KEY
```

For now, only these are required for app + hardware API:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VERDE_NODE_API_KEY
NEXT_PUBLIC_VERDE_NODE_ID
NEXT_PUBLIC_VERDE_NODE_SLUG
```

## GitHub Upload By Agent
User must provide:
1. GitHub repo URL, either empty repo or repo to overwrite/update.
2. Fine-grained GitHub token with Contents Read/Write permission for that repo.
3. Confirmation whether to push to `main` branch.

After push, revoke the token.
