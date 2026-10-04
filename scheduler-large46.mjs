export {clockMinutes,timeLabel,partitionable,validatePractice} from './scheduler.mjs?v=rpbuild29';
import {buildPractice as stableBuild} from './scheduler.mjs?v=rpbuild29';
export function buildPractice(input){
 return stableBuild(input);
}
