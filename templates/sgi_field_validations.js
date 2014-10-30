/**
 * Created by pavlovich on 10/27/14.
 */

Package.templating.Template['sgiFieldValidations'].helpers({
    formName: function(parentObj){
        if(parentObj) {
            return parentObj['formName'];
        }
        return null;
    },
    fieldId: function(parentObj){
        if(parentObj) {
            return parentObj['fieldId'];
        }
        return null;
    },
    getErrorMessageForType: function(rule){
        return rule.message || ngMeteorForms.getDefaultMessage(rule.type);
    }
});
