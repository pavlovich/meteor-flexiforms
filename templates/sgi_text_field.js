/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['mffTextField'].helpers({
    shouldShowLabel: function(){
        if(this.showLabel){
            return true;
        }else{
            return false;
        }
    },
    getMinValue: function(aField){
        var minRule = aField.getValidationOfType('min');
        if(minRule) {
            var theValue = minRule.value;
            if(theValue){
                if(_.isDate(theValue)){
                    return theValue.toISOString(); //.slice(0,10);
                }else if(_.isNumber(theValue)){
                    return theValue.toString();
                }else{
                    return theValue;
                }
            }
        }
        return null;
    },
    getMaxValue: function(aField){
        var maxRule = aField.getValidationOfType('max');
        if(maxRule) {
            var theValue = maxRule.value;
            if(theValue){
                if(_.isDate(theValue)){
                    return theValue.toISOString(); //.slice(0,10);
                }else if(_.isNumber(theValue)){
                    return theValue.toString();
                }else{
                    return theValue;
                }
            }
        }
        return null;
    },
    getType: function(type){
        if(type == 'datesingle' || type == 'datetimesingle' ){
            return 'text';
        }else{
            return type;
        }
    },
    getMffType: function(type){
        if(type == 'datesingle'){
            return 'datesingle';
        }else if (type == 'datetimesingle') {
            return 'datetimesingle';
        }else{
            return null;
        }
    }
});
