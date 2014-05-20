/**
 * Created by pavlovich on 5/6/14.
 */

var _getControllerName = function(){
    if(this.ngController){
        return this.ngController;
    }else{
        if(this.model){
            return _.camelize(this.model) + "Controller";
        }
        return 'testController';
    }
}

Package.templating.Template['flexiformsAutoform'].helpers({
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
            return 'testForm';
        }
    },
    getNgControllerAttribute: function(a, b, c){
        var hasController = false;
        _.each(ngMeteorForms._invokeQueue, function(queuedAngularConstructor){
            if(queuedAngularConstructor[1] && queuedAngularConstructor[1] == "register"){
                if(queuedAngularConstructor[2]){
                    if(queuedAngularConstructor[2][0]){
                        if(queuedAngularConstructor[2][0] == _getControllerName()){
                            hasController = true;
                        }
                    }
                }
            }
        });

        if(hasController){
            return ' ng-controller="' + this.getControllerName() + '"';
        } else {
            return "";
        }
    },
    getControllerName: function(){
        return _getControllerName();
    }
});
