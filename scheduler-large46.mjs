export {clockMinutes,timeLabel,partitionable,validatePractice} from './scheduler.mjs?v=large46b';
import {buildPractice as largeBuild} from './scheduler.mjs?v=large46b';
export function buildPractice(input){
 return largeBuild(input);
}
