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
  visible?: number,
  entitiesOnCanvas?: Array<string|number>,
  entityIds: Array<string|number>,
  index?: number,
  hidden?: boolean
}