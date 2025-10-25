# Seed Data

This directory contains JSON files with seed data for the MotorGhar platform.

## Files

- **vehicles.json** - Sample vehicle catalog (popular Nepal market vehicles)
- **service-centers.json** - Service centers in Kathmandu Valley

## Usage

These files are loaded by `prisma/seed.ts` during database seeding.

```bash
nx db:seed database
```

## Editing Seed Data

### Adding Vehicles
Edit `vehicles.json` and add entries with this structure:

```json
{
  "type": "CAR" | "BIKE",
  "make": "Manufacturer name",
  "model": "Model name",
  "year": 2023,
  "trim": "Variant",
  "engine": "Engine displacement",
  "transmission": "Manual" | "Automatic" | "CVT",
  "fuel": "Petrol" | "Diesel" | "Electric",
  "bodyType": "Vehicle body type"
}
```

### Adding Service Centers
Edit `service-centers.json` and add entries with this structure:

```json
{
  "name": "Center name",
  "address": "Full address",
  "city": "City name",
  "lat": 27.xxxx,
  "lon": 85.xxxx,
  "phone": "+977-x-xxxxxxx",
  "certified": true | false
}
```

## Notes

- Seed data is for **development and testing only**
- In production, vehicle catalogs should be managed via Admin UI
- Service centers should be added/managed through Admin panel
- GPS coordinates use decimal format (lat/lon)
- Phone numbers follow Nepal format: +977-x-xxxxxxx

## Future Enhancements

- CSV import support for bulk updates
- Validation scripts before seeding
- Version control for catalog changes
- Multi-country vehicle data
