/** @internal */
const DEFAULT_DATE_FIELDS = [
  "createdOn",
  "lastModified",
  "timestamp"
];

/** @internal */
export function fromServer<T>(target:      T,
                              source:      any,
                              dateFields:  string[]|undefined = undefined)
  : T
{
  if (!source) return source;
  if (dateFields === undefined) dateFields = DEFAULT_DATE_FIELDS;
  let field : string;
  for (field in source) {
    if (dateFields.indexOf(field) >= 0) {
      if (typeof source[field] === "number") {
        target[field] = new Date(source[field]);
      } else if (typeof source[field] === "string") {
        target[field] = new Date(source[field]);
      } else {
        target[field] = source[field];
      }
    } else {
      target[field] = source[field];
    }
  }
  return target;
}

/** @internal */
export function toServer<T>(target:     T,
                            source:     T,
                            dateFields: string[]|undefined = undefined)
  : T
{
  if (!source) return source;
  if (dateFields === undefined) dateFields = DEFAULT_DATE_FIELDS;
  let field : string;
  for (field in source) {
    if (dateFields.indexOf(field) >= 0) {
      if (typeof source[field] === "string") {
        target[field] = new Date(source[field]).getTime();
      } else if (typeof source[field] !== "number" && source[field].getTime) {
        target[field] = source[field].getTime();
      } else {
        target[field] = source[field];
      }
    } else {
      target[field] = source[field];
    }
  }
  return target;
}

/** @internal */
export function fromServerArray<T>(target:     T[],
                                   source:     any[],
                                   producer:   () => T,
                                   dateFields: string[]|undefined = undefined)
  : T[]
{
  if (!source) return source;
  source.forEach(s => {
    if (!s) {
      target.push(s);
    } else {
      target.push(fromServer<T>(producer(), s, dateFields));
    }
  });
  return target;
}

/** @internal */
export function toServerArray<T>(target:      T[],
                                 source:      T[],
                                 producer:    () => T,
                                 dateFields:  string[]|undefined = undefined)
  : T[]
{
  if (!source) return source;
  source.forEach(s => {
    if (!s) {
      target.push(s);
    } else {
      target.push(toServer<T>(producer(), s, dateFields));
    }
  });
  return target;
}
