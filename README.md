# kafka stream to web socket

## Usage:
```
npm start
```

Make sure Kafka producer is ready, make a get to a locale url with a location (lat/lon) you want keep streaming tweets exp:
```
http://localhost:3001/52.51/13.38
```

## Note:

Twitter client doesn't support streaming by lat/lon, so i do a conversion of location to a bounding box and keep streaming tweets from that bounding box.
