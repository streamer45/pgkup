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

## License

MIT
