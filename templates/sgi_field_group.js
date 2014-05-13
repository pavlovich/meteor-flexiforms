/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['sgiFieldGroup'].helpers({
    inlineFlex: function(){
        if(this.inline == "true"){
            return "sgi-inline-flex";
        }else{
            return "";
        }
    }
})
