/**
 * Diigo.com
 * Author: Liuyixi
 * Date: 13-3-8
 * Time: PM2:54
 * a lib for input auto complete.
 */
var com={};
com.diigo={};
com.diigo.auto_complete = (function(){
    /*conf
        com.diigo.auto_complete({
            id:"input",
            source:function(request,response){} || Array,
            minlength:2
            ....
        })
     */

    var opt={
            id:null,
            minlength:1,
            source:null
        },
        util = {
            getDom:function(selector){
                return document.querySelector(selector);
            }
        },
        Events = {
            keypress:function(event){
                var now = new Date().getTime();
                var interval = now - opt.lastTime;
                if(interval>150){
                    opt.lastTime = now;

                }
            }
        }

    /*初始化*/
    function init(conf){
        for(i in conf) opt[i] = conf[i];

        var inputDom = util.getDom('#'+opt['id']);
        opt.dom = inputDom;

        _bindEvent();
    }

    /*事件绑定*/
    function _bindEvent(){
        var inputDom = opt.dom;
        opt.lastTime = 0;
        inputDom.addEventListener('keypress',Events.keypress,false);

    }
    return init;
})();