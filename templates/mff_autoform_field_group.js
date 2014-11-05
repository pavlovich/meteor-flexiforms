/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['_mffAutoformFieldGroup'].helpers({
    getFields: function(theField) {

        var self = this;
        var type = theField.getType();
        var fields = type.getFields();

        _.each(fields, function (field) {
            field.base = self.base + "." + field.name;
            //TODO need to test inline fields. Do they display as expected?
            field.inline = self.inline ? true : false;
            field.parentField = type;
        });
        return fields;
    },
    groupLabel: function(a, b, c){
        if(this.label) {
            return this.label;
        }else{
            return this.getTypeName();
        }
    },
    addGroupBox: function(a, b, c){
        return !(this.embed);
       // var objType = FlexiSpecs.findByName(this.type.toString());
       // return !(objType && objType.embed);
    }
});
