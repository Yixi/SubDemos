/**
 * Diigo.com
 * Author: Liuyixi
 * Date: 13-3-8
 * Time: PM2:54
 * a lib for input auto complete.
 */
var com={};
com.diigo={};
com.diigo.Search= (function(){
    /*conf
        com.diigo.auto_complete({
            id:"input",
            source:function(request,response){} || Array,
            minlength:2
            ....
        })
     */

    var SearchBox = {
        /* default options*/
        opt:{
            id:null,
            minLength:1,
            source:null
        },

        /*变量*/
        Dom:null,
        inputDom:null,
        typeDom:null,
        searchIconDom:null,
        autoSuggestionsDom:null,
        lastTime:0,


        /*Util functions*/

        getDom:function(selector,dom_){
            var dom = dom_ || document;
            return dom.querySelector(selector);
        },

        /*Events*/

        Events:{
            _keyUp:function(event){
                var now = new Date().getTime(),
                    z = this,
                    interval = now - this.lastTime;
                if(interval>150){
                    this.lastTime  = now;
                    if(typeof this.opt.source === 'function'){
                        /*datasorce 为异步函数 */

                    }else if(typeof this.opt.source === 'object'){
                        /*datasource 为数组*/
                        z._render(z._filter(this.opt.source,event.target.value));
                    }

                }
            }
        },

        /*事件绑定*/
        _bindEvent:function(){
            this.lastTime = 0;
            this.inputDom.addEventListener('keyup',this.Events._keyUp.bind(this),false);
        },

        /*初始化*/
        init:function(conf){
            for(i in conf) this.opt[i] = conf[i];
            this.Dom = this.getDom('#'+this.opt['id']);

            this._buildSearch();
            this._bindEvent();

            console.log(this);
            return this.inputDom;
        },

        /*私有方法*/

        _buildSearch:function(){
            var html =
                '<div id="diigo_a_search">' +
                '<div class="d_s_type"></div>' +
                '<input type="text" class="d_s_input" name="q" />' +
                '<div class="d_s_seachicon"></div>' +
                '<div class="d_s_autosuggess" style="position: absolute;width: 300px;left: 50px;background: rosybrown;min-height: 10px;"></div> ' +
                '</div>';
            this.Dom.innerHTML = html;
            this.typeDom = this.getDom(".d_s_type",this.Dom);
            this.inputDom = this.getDom(".d_s_input",this.Dom);
            this.searchIconDom = this.getDom(".d_s_seachicon",this.Dom);
            this.autoSuggestionsDom = this.getDom(".d_s_autosuggess",this.Dom);
        },

        _render:function(value){
            console.log(value);
            var inputText = this.inputDom.value;
            if(inputText.length<1){
                this.autoSuggestionsDom.style.display="none";
                return;
            }else{
                this.autoSuggestionsDom.style.display = "";
            }
            var html = '<ul>';
            for(var i= 0,len=value.length;i<len;i++){
                html += "<li>Tags: "+value[i]+"</li>";
            }
            html+='<li class="meta">Meta: '+inputText+' </li> ' +
                  '<li class="fulltext">Full text: '+inputText+'</li> ';
            html+='</ul>';
            this.autoSuggestionsDom.innerHTML = html;
        },


        /*Filter 方法, from jquery*/

        _grep:function(e,t,n){
            var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i;
        },
        _escapeRegex:function(value){
            return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
        },
        _filter:function(array,term){
            var matcher = new RegExp(this._escapeRegex(term),"i");
            return this._grep(array,function(value){
                return matcher.test(value);
            });
        }




    };

    return SearchBox.init.bind(SearchBox);
})();