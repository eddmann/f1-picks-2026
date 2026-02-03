/**
 * Converts SQLite/D1 integer booleans (0/1) to JavaScript booleans
 * for known boolean fields in database objects.
 */

export function convertRace<
  T extends { has_sprint: unknown; is_wild_card: unknown },
>(race: T): T {
  return {
    ...race,
    has_sprint: Boolean(race.has_sprint),
    is_wild_card: Boolean(race.is_wild_card),
  };
}

export function convertSeason<T extends { is_active: unknown }>(season: T): T {
  return {
    ...season,
    is_active: Boolean(season.is_active),
  };
}
