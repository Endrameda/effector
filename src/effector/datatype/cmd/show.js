//@flow

import * as Name from './type'
import * as Type from './impl'

export function show(value: Type.Cmd): string {
 switch (value.type) {
  case Name.EMIT:
   return `Emit(${value.data.fullName})`
  case Name.RUN:
   return 'Run'
  case Name.COMPUTE:
   return 'Compute'
  case Name.FILTER:
   return 'Filter'
  case Name.UPDATE:
   return 'Update'
  default:
   /*::(value.type: empty)*/
   throw new Error('impossible type')
 }
}
