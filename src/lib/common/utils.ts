import { SzDataSourceComposite } from '../models/data-sources';
import { SzMatchKeyTokenComposite, SzMatchKeyComposite } from '../models/graph';

/**
 * A reusable function to remove any null or undefined values, and their
 * associated keys from a json object.
 * used internally.
 */
export function JSONScrubber(value: any): any {
  const _repl = (name, val) => {
    if(!val || val == undefined || val == null || typeof val == 'undefined'){
      return undefined;
    }
    return val
  }
  if(value){
    return JSON.parse(JSON.stringify(value, _repl));
  }
}
/** convert value of any type who's value can be converted to boolean */
export function parseBool(value: any): boolean {
  if (!value || value === undefined) {
    return false;
  } else if (typeof value === 'string') {
    return (value.toLowerCase().trim() === 'true') ? true : false;
  } else if (value > 0) { return true; }
  return false;
};
/** convert value of any type who's value can be converted to number */
export function parseNumber(value: any) {
  if (!value || value === undefined) {
    return -1; // not a number
  } else if (typeof value === 'string') {
    return parseInt(value.trim());
  } else if (typeof value === 'number') { 
    return value as number; 
  }
  return value as number;
}
/** convert value of any type who's value can be converted to Date object */
export function parseDate(value: any) {
  if (!value || value === undefined) {
    return undefined;
  } else if(value && value.getTime) {
    // is already valid date object
    return value;
  } else if(value && !value.getTime) {
    // not a date object
    // check to see if it can be parsed
    if(Date && !isNaN( Date.parse(value))) {
      // valid date, cast to object
      return new Date(value);
    }
    // not parseable datetime
    return undefined
  } 
}
/** convert value of any type who's value can be converted to SzIdentifier */
export function parseSzIdentifier(value: any): number {
  let retVal = 0;
  if (value && value !== undefined) {
    try{
      retVal = parseInt(value);
    }catch(err){
      console.error('parseSzIdentifier: error: '+ err);
    }
  }
  return retVal;
}
/** check whether a value is boolean */
export function isBoolean(value: any) {
  let retVal = false;
  if(typeof value === 'boolean') {
    retVal = true;
  } else if(typeof value === 'string' && (value as string).toLowerCase() && ((value as string).toLocaleLowerCase() === 'true' || (value as string).toLocaleLowerCase() === 'false')) {
    retVal = true;
  }
  return retVal;
}
/** trim empty values */
export function nonTextTrim(value: string): string {
  let retVal = value;
  return retVal;
}
/** is a value null */
export function isNotNull(value?: string | any) {
  let retVal = false;
  if((value as string) && (value as string) !== undefined) {
    if((value as string).trim && (value as string).trim() !== '' && (value as string).replaceAll(' ','').trim() !== '') {
      return true;
    }
  }
  return retVal;
}

/**
 * Function used to return an array of "SzDataSourceComposite" in the order 
 * specified by each members "index" property
 */
export function sortDataSourcesByIndex(value: SzDataSourceComposite[]): SzDataSourceComposite[] {
  let retVal  = value;
  if(retVal && retVal.sort) {
    // first sort by any existing indexes
    retVal = retVal.sort((a, b) => {    
        if (a.index > b.index) {
            return 1;
        } else if (a.index < b.index) {    
            return -1;
        } else {
          // sort by name
        }
        return 0;
    });
    // now update index values to same as array
    retVal  = retVal.map((_dsVal: SzDataSourceComposite, _index: number) => {
      let _reIndexed  = _dsVal;
      _reIndexed.index = _index;
      return _reIndexed;
    });
  }
  return retVal;
}

export function sortMatchKeysByIndex(value: SzMatchKeyComposite[]): SzMatchKeyComposite[] {
  let retVal  = value;
  if(retVal && retVal.sort) {
    // first sort by any existing indexes
    retVal = retVal.sort((a, b) => {    
        if (a.index > b.index) {
            return 1;
        } else if (a.index < b.index) {    
            return -1;
        } else {
          // sort by name
        }
        return 0;
    });
    // now update index values to same as array
    retVal  = retVal.map((_mkVal: SzMatchKeyComposite, _index: number) => {
      let _reIndexed  = _mkVal;
      _reIndexed.index = _index;
      return _reIndexed;
    });
  }
  return retVal;
}

export function getArrayOfPairsFromMatchKey(matchKey: string): Array<{prefix: string, value: string}> {
  // tokenize by "+" first
  let _pairs  = matchKey.split('+').filter((t)=>{ return t !== undefined && t !== null && t.trim() !== ''; });
  // do secondary parse for "-" signs and then flatten array
  let pairs = _pairs.map((t)=>{
      if(t.indexOf('-') > -1) {
          // first clip off positive part of array
          let posToken    = t.substring(0, t.indexOf('-'));
          //console.log(`\tfound exclusion tokens: "${t.substring(t.indexOf('-'))}"`);
          let exTokens    = t.substring(t.indexOf('-')).split('-').filter((t)=>{ return t !== undefined && t !== null && t.trim() !== ''; })
          let retVal      = [{prefix: '+', value: posToken }];
          retVal = retVal.concat(exTokens.map((exclusionToken) => { return {prefix: '-', value: exclusionToken }; }));
          return retVal;
      } else {
          return {prefix: '+', value: t}
      }
  });
  let _values = pairs.flat();
  return _values;
}
export function getMapFromMatchKey(matchKey: string): Map<string, {prefix: string, value: string}> {
  let retVal = new Map();
  let matchKeyAsArray = getArrayOfPairsFromMatchKey(matchKey);
  if(matchKeyAsArray && matchKeyAsArray.length > 0 && matchKeyAsArray.forEach) {
    matchKeyAsArray.forEach((mkPair)=>{
      retVal.set(mkPair.value, mkPair);
    });
  }
  return retVal;
}

export function sortMatchKeyTokensByIndex(value: SzMatchKeyTokenComposite[]): SzMatchKeyTokenComposite[] {
  let retVal  = value;
  if(retVal && retVal.sort) {
    // first sort by any existing indexes
    retVal = retVal.sort((a, b) => {    
        if (a.index > b.index) {
            return 1;
        } else if (a.index < b.index) {    
            return -1;
        } else {
          // sort by name
        }
        return 0;
    });
    // now update index values to same as array
    retVal  = retVal.map((_mkVal: SzMatchKeyTokenComposite, _index: number) => {
      let _reIndexed  = _mkVal;
      _reIndexed.index = _index;
      return _reIndexed;
    });
  }
  return retVal;
}
/** is value a type of array object */
export function isValueTypeOfArray(value: any) {
  let retVal = false;
  if(value) {
    let valueAsArray = (value as unknown);
    if(valueAsArray && (valueAsArray as []).map && (valueAsArray as []).every) {
      retVal = (valueAsArray as []).every(() => { return true; });
    }
  }
  return retVal;
}
