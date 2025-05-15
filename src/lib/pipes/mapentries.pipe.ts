import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'SzOrderedMapEntries',
    standalone: false
})
export class SzOrderedMapEntries implements PipeTransform {

  transform<K, V>(input: Map<K, V>): Array<any> {
    return Array.from(input).map(([key, value]) => ({ key, value }));
  }
}