/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['mffFieldGroup'].helpers({
    inlineFlex: function(){
        if(this.inline == "true"){
            return "mff-inline-flex";
        }else{
            return "";
        }
    }
})
