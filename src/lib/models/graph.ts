import { SzEntityIdentifier } from "@senzing/rest-api-client-ng"

export interface SzMatchKeyComposite {
    name: string,
    index?: number,
    hidden?: boolean
  }

export interface SzMatchKeyTokenComposite {
  derived: boolean,
  disclosed: boolean,
  name: string
  count: number,
  coreCount?: number,
  visible?: number,
  entitiesOnCanvas?: Array<string|number>,
  entityIds: Array<string|number>,
  coreEntityIds?: Array<SzEntityIdentifier>,
  index?: number,
  hidden?: boolean
}