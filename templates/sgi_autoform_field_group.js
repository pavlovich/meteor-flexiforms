/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['_sgiAutoformFieldGroup'].helpers({
    getFields: function(fieldsObject) {

        var self = this;
        var type = fieldsObject.getType();

        //TODO get rid of fieldmap usage. Revert to expecting an array.
        var fields = type.getFieldMap();

        _.each(fields, function (field, index) {
            field.base = self.base + "." + index;
            //TODO need to test inline fields. Do they display as expected?
            field.inline = self.inline ? true : false;
            field.parentField = type;
        });
        return _.toArray(fields);
    },
    groupLabel: function(a, b, c){
        if(this.label) {
            return this.label;
        }else{
            return this.type;
        }
    },
    addGroupBox: function(a, b, c){
        return !(this.embed);
       // var objType = FlexiSpecs.findByName(this.type.toString());
       // return !(objType && objType.embed);
    }
});
