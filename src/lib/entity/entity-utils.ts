import { SzResolvedEntity } from '@senzing/rest-api-client-ng';

const EMAIL_PATTERNS : RegExp[] = [
  /^[^:]+ EMAIL:(.*)$/i,
  /^EMAIL \([^\):]+\):(.*)$/i,
  /^EMAIL:\s*[^:]+:(.*)$/i,
  /^EMAIL:(.*)$/i,
];

/**
 * Internal function for checking if an identifier matches an email pattern.
 * @param identifier The identifier to check.
 */
function checkEmailPattern(identifier: string) : RegExp | null {
  if (!identifier) return null;
  const found = EMAIL_PATTERNS.find(pattern => (identifier.match(pattern) ? true : false));
  if (found) return found;
  return null;
}

/**
 * A reusable function to obtain the best displayable name for
 * an instance of SzResolvedEntity.  This will first attempt to
 * leverage the "bestName" and "entityName" fields if they exist
 * on the specified parameter and are non-empty.  Otherwise, it
 * will do its best to find a name among the features of the entity.
 * As a fall back a name is created using the entity ID.
 *
 * @param entity The SzResolvedEntity to get the name for.
 * @return This returns the best name for the specified entity, or
 *         "-" if the specified entity is null or undefined.
 */
export function bestEntityName(entity: SzResolvedEntity): string {
  if (!entity) return "-";
  if (entity.bestName && entity.bestName.trim().length > 0) {
    return entity.bestName.trim();
  }
  if (entity.entityName && entity.entityName.trim().length > 0) {
    return entity.entityName.trim();
  }
  if (entity.nameData && entity.nameData.length > 0 && entity.nameData[0].trim().length > 0) {
    return entity.nameData[0].trim();
  }
  if (entity.identifierData && entity.identifierData.findIndex(s => (checkEmailPattern(s) ? true : false)) >= 0)
  {
    const found   = entity.identifierData.find(s => (checkEmailPattern(s) ? true : false));
    const pattern = checkEmailPattern(found);
    const email   = found.replace(pattern, "$1");
    if (email) return email.trim();
  }
  return "[Entity " + entity.entityId + "]";
}
