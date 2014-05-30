/**
 * Created by pavlovich on 5/6/14.
 */

var _getControllerName = function(element){
    if(element && element.context && element.context.getAttribute('meteor-forms-controller')){
        return element.context.getAttribute('meteor-forms-controller');
    }else{
        if(element && element.context && element.context.getAttribute('model')){
            return _.camelize(element.context.getAttribute('model')) + "Controller";
        }
        return 'testController';
    }
};

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
            return 'testForm';
        }
    },
    hasController: function(element){
        var hasController = false;
        _.each(ngMeteorForms._invokeQueue, function(queuedAngularConstructor){
            if(queuedAngularConstructor[1] && queuedAngularConstructor[1] == "register"){
                if(queuedAngularConstructor[2]){
                    if(queuedAngularConstructor[2][0]){
                        if(queuedAngularConstructor[2][0] == _getControllerName(element)){
                            hasController = true;
                        }
                    }
                }
            }
        });
        if (element && element.context && element.context.getAttribute('meteor-forms-controller') && !hasController){
            console.log("Expected to find angular controller with name: '" + element.context.getAttribute('meteor-forms-controller') + "'.");
        }
        return hasController;
    },
    getControllerName: function(element){
        return _getControllerName(element);
    },
    getModelId: function(){
        return modelId;
    },
    getElement: function(){
        return this.$$element;
    }
});
