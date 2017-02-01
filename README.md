# pgkup

## Usage

```
npm i
npm start config.json
```

## Config

Config file should include a valid JSON object of this kind:

```json
{
  "db": "mydb",
  "path": "/home/streamer45/backups",
  "backups": {
    "hours": 24,
    "days": 7,
    "weeks": 4,
    "months": 12
  }
}
```

which translated means: backup mydb to /home/streamer45/backups and keep the last 24 hourly backups, the last 7 daily backups, the last 4 weekly backups and the last 12 monthly backups on a rolling basis.

### Note

The script should be run at least every hour (if you want hourly backups) via a crond rule or a systemd timer for example.

## License

MIT
