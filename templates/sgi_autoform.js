/**
 * Created by pavlovich on 5/6/14.
 */

Package.templating.Template['sgiAutoform'].helpers({
    getModelFields: function(modelName, x){
        var type = FlexiSpecs.findOne({name: modelName});
        var fieldsObject = type.fields;
        var fields = [];
        _.each(fieldsObject, function (value, index) {
            if(fieldsObject.hasOwnProperty(index)) {
                var obj = _.clone(value);
                obj.base = modelName + "." + index;
                obj.field = value;
                obj.parentField = type;
                obj.showLabel = 'i did it here';
                fields.push(obj);
            }});
        return fields;
    },
    getFormClass: function(){
        if(this.class){
            return this.class;
        }else{
            return 'simple-form';
        }
    },
    getFormName: function(){
        if(this.name){
            return this.name;
        }else{
            if(this.model){
                return _.camelize(this.model) + "Form";
            }
            return 'xtestForm';
        }
    },
    getControllerName: function(){
        if(this.ngController){
            return this.ngController;
        }else{
            if(this.model){
                return _.camelize(this.model) + "Controller";
            }
            return 'testController';
        }
    }
});
