/**
 * Created by pavlovich on 10/14/14.
 */
////////////////////////////////////////////////////////////////////
/**
 * Base type prototype additions
 */
////////////////////////////////////////////////////////////////////

String.prototype.toCamel = function(){
    return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};