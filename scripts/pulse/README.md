# City pulse (optional)

Writes the numbers for the paused title screen's top panel into `public.city_pulse` every couple of minutes.
The panel only shows while the city is paused (`CITY_PAUSED` in `src/membership/waitlist.ts`).

**Be honest with visitors.** The panel shows whatever is in `public.city_pulse`. `step.mjs` here *simulates* a
slowly growing, plausible-looking set of numbers; it does not count anyone. That is fine for a demo, but for a real
launch prefer writing real counts (members online, people on the waitlist) to the table from your own job, and
skip this script. If the script stops, the site keeps showing the last numbers written.

Needs Node 18+ (`node -v`) on any always-on Linux machine with systemd, and the table from
`supabase/migrations/20261115120000_city_pulse.sql`.

## Set up (once)

```sh
# 1. the script
mkdir -p ~/city-pulse && cp step.mjs pulse.mjs ~/city-pulse/

# 2. the keys (your Supabase project; the SECRET key, never commit it)
cat > ~/.config/city-pulse.env <<'EOF'
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
EOF
chmod 600 ~/.config/city-pulse.env

# 3. try it once
set -a; . ~/.config/city-pulse.env; set +a; node ~/city-pulse/pulse.mjs
# → [pulse] 1/2 recruiters · 3/8 members · 5 waiting

# 4. every 2 minutes (± up to 50 s), as a systemd user timer
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/city-pulse.service <<EOF
[Unit]
Description=City pulse

[Service]
Type=oneshot
EnvironmentFile=%h/.config/city-pulse.env
ExecStart=$(command -v node) %h/city-pulse/pulse.mjs
EOF
cat > ~/.config/systemd/user/city-pulse.timer <<'EOF'
[Unit]
Description=Run the city pulse every 2 minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
RandomizedDelaySec=50
AccuracySec=1s

[Install]
WantedBy=timers.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now city-pulse.timer

# 5. keep it running when you're logged out
sudo loginctl enable-linger "$USER"
```

## Check on it

```sh
systemctl --user list-timers city-pulse.timer   # next run
journalctl --user -u city-pulse -n 20           # last runs and their numbers
```

## Stop it

```sh
systemctl --user disable --now city-pulse.timer
```
