/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['_sgiAutoformFieldGroup'].helpers({
    getFields: function(fieldsObject) {
        var self = this;
        var type = FlexiSpecs.findOne({name: this.type.toString()});
        var fieldsObject = type.fields;
        var fields = [];
        _.each(fieldsObject, function (value, index) {
            if(fieldsObject.hasOwnProperty(index)) {
                var obj = _.clone(value);
                obj.base = self.base + "." + index;
                obj.field = value;
                obj.inline = self.inline ? true : false;
                obj.showLabel = "I did it there";
                obj.parentField = type;
                fields.push(obj);
            }});
        return fields;
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
       // var objType = FlexiSpecs.findOne({name: this.type.toString()});
       // return !(objType && objType.embed);
    }
});
