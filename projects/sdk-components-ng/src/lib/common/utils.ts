
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
