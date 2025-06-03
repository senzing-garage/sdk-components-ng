import { SzLoadedStats, SzSourceLoadedStats, SzLoadedStatsResponse, SzResolvedEntity, SzRelatedEntity, SzRecord, SzMatchedRecord, SzEntityRecord, SzRelation, SzEntity, SzBoundType, SzCrossSourceSummary } from "@senzing/rest-api-client-ng";
import { Observable } from "rxjs";

export interface SzCountStatsForDataSourcesResponse extends SzLoadedStatsResponse {
    /** override with extended */
    data?: SzStatCountsForDataSources;
}
export interface SzStatCountsForDataSources extends SzLoadedStats {
    /** we add pending count so app can optionally inject values */
    totalPendingCount?: number,
    /** we change this to the extended model which includes color and pending count */
    dataSourceCounts: SzRecordCountDataSource[]
}
export interface SzRecordCountDataSource extends SzSourceLoadedStats {
    pendingCount?: number,
    color?: string
}

export type SzCrossSourceSummaryCategoryType = 'MATCHES' | 'AMBIGUOUS_MATCHES' | 'POSSIBLE_MATCHES' | 'POSSIBLE_RELATIONS' | 'DISCLOSED_RELATIONS';
/** the possible values of a `SzCrossSourceSummaryCategoryType` is */
export const SzCrossSourceSummaryCategoryType = {
    MATCHES: 'MATCHES' as SzCrossSourceSummaryCategoryType,
    AMBIGUOUS_MATCHES: 'AMBIGUOUS_MATCHES' as SzCrossSourceSummaryCategoryType,
    POSSIBLE_MATCHES: 'POSSIBLE_MATCHES' as SzCrossSourceSummaryCategoryType,
    POSSIBLE_RELATIONS: 'POSSIBLE_RELATIONS' as SzCrossSourceSummaryCategoryType,
    DISCLOSED_RELATIONS: 'DISCLOSED_RELATIONS' as SzCrossSourceSummaryCategoryType
};

export const SzCrossSourceSummaryCategoryTypeToMatchLevel = {
    MATCHES: 1,
    AMBIGUOUS_MATCHES: 3,
    POSSIBLE_MATCHES: 2,
    POSSIBLE_RELATIONS: 3,
    DISCLOSED_RELATIONS: 3
}

export interface SzCrossSourceSummarySelectionEvent {
    dataSource1?: string,
    dataSource2?: string,
    matchLevel?: number,
    matchKey?: string,
    principle?: string,
    statType?: SzCrossSourceSummaryCategoryType
}

export interface SzCrossSourceSummarySelectionClickEvent extends MouseEvent {
    dataSource1?: string,
    dataSource2?: string,
    matchLevel?: number,
    statType?: SzCrossSourceSummaryCategoryType
}

export interface SzStatSampleEntityTableItem extends SzResolvedEntity {
    relatedEntities?: SzDataTableRelatedEntity[],
    relatedEntity?: SzDataTableRelatedEntity,
    recordCount?: number,
    records?: SzRecord[] | SzMatchedRecord[],
    rows?: SzStatSampleEntityTableRow[],
    dataType?: SzStatSampleEntityTableRowType;
}

export interface SzStatsSampleTableLoadingEvent {
    inflight: boolean,
    source: string
}

export interface SzDataTableEntity extends SzEntity {
    dataType?: SzStatSampleEntityTableRowType;
}
export interface SzDataTableRelatedEntity extends SzRelatedEntity {
    rows?: SzStatSampleEntityTableRow[],
    dataType?: SzStatSampleEntityTableRowType;
}
export interface SzDataTableRelation extends SzRelation {
    entity: SzDataTableEntity;
    relatedEntity: SzDataTableEntity;
}

export interface SzStatSampleEntityTableRowEntity extends SzEntity {
}

export interface SzDataTableCellEvent {
    "key": string,
    "value": any,
    "event"?: MouseEvent
}

/*
let _allColumns = [
    'Entity ID',
    'More',
    'ER Code',
    'Match Key',
    'Related Entity ID',
    'Data Source',
    'Record ID',
    'Entity Type',
    'Name Data',
    'Attribute Data',
    'Address Data',
    'Relationship Data'
  ];
*/
export type SzStatSampleEntityTableRowType = 'ENTITY' | 'ENTITY_RECORD' | 'RELATED' | 'RELATED_RECORD' | 'DEBUG' | 'DEBUG2';
export const SzStatSampleEntityTableRowType = {
    ENTITY: 'ENTITY' as SzStatSampleEntityTableRowType,
    ENTITY_RECORD: 'ENTITY_RECORD' as SzStatSampleEntityTableRowType,
    DEBUG: 'DEBUG' as SzStatSampleEntityTableRowType,
    DEBUG2: 'DEBUG2' as SzStatSampleEntityTableRowType,
    RELATED: 'RELATED' as SzStatSampleEntityTableRowType,
    RELATED_RECORD: 'RELATED_RECORD' as SzStatSampleEntityTableRowType
};

export interface SzStatSampleEntityTableRow extends SzResolvedEntity, SzMatchedRecord {
    /**
     * The data source code identifying the data source from  which the record was loaded.
     */
    dataSource?: string;
    /**
     * The record ID that uniquely identifies the record within the data source from which it was loaded.
     */
    recordId?: string;
    /**
     * The optional match key describing why the record merged into the entity to which it belongs.  This may be absent or `null` if this record belongs to a single-record entity or if it was the initial record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    matchKey?: string;
    /**
     * The optional principle identifying the resolution rule that was used to merge the record into the entity to which it belongs.  This may be absent or `null` if this record belongs to a single-record entity or if it was the initial record of the first multi-record entity to which it belonged (even if it later re-resolved into a larger entity).
     */
    principle?: string;
    /**
     * the type of data construct this row represents
     */
    dataType?: SzStatSampleEntityTableRowType
}

export interface SzDataTableRelationsPagingParameters {
    /**
     * The relationship bound value that contains two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the first entity in the relationship and the second entity  ID value identifies the related entity in the relationship.
     */
    bound: string;
    boundType: SzBoundType;
    /**
     * The requested page size representing the maximum number of  `SzRelation`'s' that were included in the page.
     */
    pageSize: number;
    /**
     * The requested sample size representing the number of `SzRelation`'s to be randomly selected from the page of results.
     */
    sampleSize?: number;
    /**
     * The minimum relation value of the returned results.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the least value of first entity in the relationship and the second entity ID value identifies the least value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    minimumValue?: string;
    /**
     * The maximum relation value of the returned results.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the greatest value of first entity in the relationship and the second entity ID value identifies the greatest value of those entity ID's related to the first  entity.  **NOTE:** This field is absent or `null` if there are no results.
     */
    maximumValue?: string;
    /**
     * The minimum relation value of the entire relations page.  This will be the same as `minimumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the minimum relation value of all the candidate relations on the page that were used for random sample selection even if that relation was not randomly selected.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the least value of first entity in the relationship and the second entity ID value identifies the least value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMinimumValue?: string;
    /**
     * The maximum relation value of the entire relations page.  This will be the same as `maximumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the maximum relation value of all the candidate relations on the page that were used for random sample selection even if that relation was not randomly selected.  This is encoded the same as the `bound` value with two (2) entity ID values separated by a colon (e.g.: `1000:5005`).  The first entity ID value identifies the greatest value of first entity in the relationship and the second entity ID value identifies the greatest value of those entity ID's related to the first entity. **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMaximumValue?: string;
    /**
     * The total number of relationships representing the set of all  possible results across all pages.
     */
    totalRelationCount: number;
    /**
     * The number of relationships in the set that exist on pages before this page.
     */
    beforePageCount: number;
    /**
     * The number of relationships in the set that exist on pages after this page.
     */
    afterPageCount: number;
}
export interface SzDataTableEntitiesPagingParameters {
    /**
     * The entity ID bound value that bounds the returned entity ID's.
     */
    bound: number;
    boundType: SzBoundType;
    /**
     * The requested page size representing the maximum number of  entities that were included in the page.
     */
    pageSize: number;
    /**
     * The requested sample size representing the number of entities to be randomly selected from the page of results.
     */
    sampleSize?: number;
    /**
     * The minimum entity ID of the returned results.  **NOTE:** This field is absent or `null` if there are no results.
     */
    minimumValue?: number;
    /**
     * The maximum entity ID of the returned results.  **NOTE:** This field is absent or `null` if there are no results.
     */
    maximumValue?: number;
    /**
     * The minimum entity ID of the entire entity page.  This will  be the same as `minimumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the minimum entity ID value of all the candidate entities on the page that were used for random sample selection even if that entity was not randomly selected.  **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMinimumValue?: number;
    /**
     * The maximum entity ID of the entire entity page.  This will  be the same as `maximumValue` if `sampleSize` was not  specified, however, if `sampleSize` was specified then this  will be the maximum entity ID value of all the candidate entities on the page that were used for random sample selection even if that entity was not randomly selected.  **NOTE:** This field is absent or `null` if there are no results.
     */
    pageMaximumValue?: number;
    /**
     * The total number of entities representing the set of all  possible results across all pages.
     */
    totalEntityCount: number;
    /**
     * The number of entities in the set that exist on pages before  this page.
     */
    beforePageCount: number;
    /**
     * The number of entities in the set that exist on pages after this page.
     */
    afterPageCount: number;
}


export interface sampleDataSourceChangeEvent {
    dataSource1?: string,
    dataSource2?: string
}

export interface SzStatSampleSetParameters {
    dataSource1?: string;
    dataSource2?: string;
    bound?: string;
    boundType?: SzBoundType;
    pageSize?: number;
    statType: SzCrossSourceSummaryCategoryType;
    page?: number;
    matchKey?: string;
    principle?: string;
    sampleSize?: number
}
export interface SzStatSampleSetPageChangeEvent extends SzStatSampleSetParameters {
    totalCount?: number;
    pageIndex: number;
    pageItemCount: number;
    afterPageCount?: number;
    beforePageCount?: number;
    maximumValue?: string | number;
    minimumValue?: string | number;
    pageMaximumValue?: string | number;
    pageMinimumValue?: string | number;
}

/** http requests object that wraps the three different api observables that need to
 * happen before the summary component can be rendered. (basically a httpRequest rollup)
 */
export interface SzCrossSourceSummaryRequests {
  fromDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean>
  overlapDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean>
  toDataSource?: Observable<SzCrossSourceSummary> | Observable<boolean>
}
/** data response object that wraps the three different api calls that need to
 * happen before the summary component can be rendered. (basically a httpResponse rollup)
 */
export interface SzCrossSourceSummaryResponses {
  fromDataSource?: SzCrossSourceSummary
  overlapDataSource?: SzCrossSourceSummary
  toDataSource?: SzCrossSourceSummary
}

export interface SzCrossSourceCount {
    /**
     * The optional match key associated with the statistics.  This may be `null` or absent if the statistics are not associated with a match key.
     */
    matchKey?: string;
    /**
     * The optional principle associated with the statistics.  This may be `null` or absent if the statistics are not associated with a principle.
     */
    principle?: string;
    /**
     * The number of entities having at least one record from the primary data source related by a relationship of the respective relationship type to  an entity with at least one record from the \"versus\" data source.
     */
    entityCount?: number;
    /**
     * The number of records from the primary data source in the entities described by the `entityCount`.  NOTE: this is not the total number of records in those entities, but only the count of those records from the primary data source.
     */
    recordCount?: number;
    /**
     * The number of relationships of the respective relationship type between entities having at least one record from the primary data source and entities having at least one record from the \"versus\" data source.
     */
    relationCount?: number;
}
