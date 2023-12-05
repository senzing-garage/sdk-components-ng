import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'SzDecimalPercent'
  })
  export class SzDecimalPercentPipe implements PipeTransform {
    transform(percent: number, precision: number = 1): any {
      if (isNaN(percent))    return null; // will only work value is a number
      if (percent === null)  return null;
      if (percent === 0)     return null;
      if((percent * 100) < 1){
        // add floating point so user can see something other than "0%"
        return (percent * 100).toFixed(precision) +'%';
      }
      // we don't care about the ".32492%" part if > 1
      return (percent * 100).toFixed(0)+'%';
    }
  }