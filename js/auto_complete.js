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
    if(!Function.prototype.bind){
        //TODO: extend the bind function in ECMAscript 3.


    }

    var SearchBox = {
        version:"1.0.0",
        /* default options*/
        opt:{
            id:null,
            minLength:1,
            source:null,
            delay:300,
            multi:false
        },

        /*变量*/
        Dom:null,
        inputDom:null,
        typeDom:null,
        typeSelectDom:null,
        searchIconDom:null,
        autoSuggestionsDom:null,
        lastTime:0,
        isChange:null,
        lastInputValue:null,



        /*Util functions*/
        keyCode:{
            BACKSPACE: 8,
            COMMA: 188,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38
        },
        getDom:function(selector,dom_){
            //TODO:
            var dom = dom_ || document;
            return dom.querySelector(selector);
        },

        _delay:function(id_,fn){
            var z = this;
            if(id_) clearTimeout(id_);
            var id = setTimeout(fn, z.opt.delay);
            return id;
        },

        _addClass:function(className,dom){

        },
        _removeClass:function(className,dom){

        },

        /*Events*/


        _change:function(event){
            var z = this,
                request;
            if(!!z.opt.multi === false) request = event.target.value;
            else if(z.opt.multi === true){
                var tags = event.target.value.split(" ");
                request = tags[tags.length-1];
            }else{
                var tags = event.target.value.split(z.opt.multi);
                request = tags[tags.length-1];
            }
            if(request.length<1){
                z._response()([]);
                return;
            }
            if(typeof z.opt.source === 'function'){
                /*datasorce 为异步函数 */
                z.opt.source(request, z._response());


            }else if(typeof z.opt.source === 'object'){
                /*datasource 为数组*/
                z._render(z._filter(this.opt.source,request));
            }
        },
        __change:function(event){
            var z = this;
            z.isChange = z._delay(z.isChange,function(){
                z._change(event);
                z.lastInputValue = z.inputDom.value;
            })
        },
        __keyDown:function(event){
            var dom,
                z=this;
            if(z.autoSuggestionsDom.style.display!='none') dom = z.autoSuggestionsDom;
            switch(event.keyCode){
                case z.keyCode.DOWN:
                    z._Down(dom);
                    event.preventDefault();
                    break;
                case z.keyCode.UP:
                    z._Up(dom);
                    event.preventDefault();
                    break;
                case z.keyCode.ENTER:
//                    z._Select(dom);
                    break;
            }

        },
        __focusOut:function(event){
            this.autoSuggestionsDom.style.display='none';
            this.autoSuggestionsDom.innerHTML = "";
        },
        __typeClick:function(event){
            var z = this;
            if(this.typeSelectDom.style.display!='none'){
                this.typeSelectDom.style.display = 'none';
            }else{
                this.typeSelectDom.style.display ='';
                document.body.addEventListener('click',function(e){
                    console.log(e.target);
                },false);
            }
        },
        __typeSelect:function(event){
            switch(event.target.id){
                case 'd_s_tag_search':
                    this.typeDom.textContent = 'Tag Search';
                    this.typeDom.id = 'd_s_type_tag';
                    break;
                case 'd_s_meta_search':
                    this.typeDom.textContent = 'Meta search';
                    this.typeDom.id = 'd_s_type_meta';
                    break;
                case 'd_s_full_search':
                    this.typeDom.textContent = 'Full Text Search';
                    this.typeDom.id = 'd_s_type_full';
                    break
            }
            this.typeSelectDom.style.display = 'none';
        },
        __suggestionSelect:function(event){
            var t = event.target,
                li;
            if(t.tagName=='SPAN'){
                li = t.parentNode;
            }else if(t.tagName=="LI"){
                li = t;
            }
            this.autoSuggestionsDom.getElementsByClassName('d_s_select')[0].className = ""
            li.className='d_s_select';
            this._Select(this.autoSuggestionsDom);
            this.__focusOut();
            this.inputDom.focus();
            event.preventDefault();
        },

        /*事件绑定*/

        _bindEvent:function(){
            this.lastTime = 0;
            this.inputDom.addEventListener('input', this.__change.bind(this),false);
//            this.inputDom.addEventListener('focusout',this.__focusOut.bind(this),false);
            this.Dom.addEventListener('keydown',this.__keyDown.bind(this),false);
            this.typeDom.addEventListener('click',this.__typeClick.bind(this),false);
            this.typeSelectDom.addEventListener('click',this.__typeSelect.bind(this),false);
            this.autoSuggestionsDom.addEventListener('click',this.__suggestionSelect.bind(this),false);
        },

        /* UI select*/
        _Select:function(dom){
            var selectDoms = dom.getElementsByClassName('d_s_select');
            var label = selectDoms[0].getElementsByTagName('span')[0].textContent;
            var type = selectDoms[0].getElementsByTagName('span')[0].className;
            if(type=='d_s_meta' || type=='d_s_full'){
                this.inputDom.value = label;
                return;
            }
            if(!!this.opt.multi===false){
                this.inputDom.value = label;
            }else if(this.opt.multi===true){
                var tags = this.lastInputValue.split(" ");
                tags[tags.length-1] = label;
                this.inputDom.value = tags.join(" ");
            }else{
                var tags = this.lastInputValue.split(this.opt.multi);
                tags[tags.length-1] = label;
                this.inputDom.value = tags.join(this.opt.multi);
            }
        },
        _Up:function(dom){
            if(!dom) return;
            var lis = dom.getElementsByTagName('li'),
                len = lis.length;
            if(dom.getElementsByClassName('d_s_select').length<1){
                dom.getElementsByTagName('li')[len-1].className="d_s_select";
            }else{
                var index = this.classIndexOfTags('d_s_select','li',dom);
                if(index>0) index--;
                else return;
                dom.getElementsByClassName('d_s_select')[0].className = ""
                lis[index].className = "d_s_select";
            }
            this._Select(dom);
        },

        _Down:function(dom){
            if(!dom) return;
            if(dom.getElementsByClassName('d_s_select').length<1){
                dom.getElementsByTagName('li')[0].className="d_s_select";
            }else{
                var index = this.classIndexOfTags('d_s_select','li',dom),
                    lis = dom.getElementsByTagName('li'),
                    len = lis.length;
                if(index<len-1) index++;
                else return;
                dom.getElementsByClassName('d_s_select')[0].className = ""
                lis[index].className = "d_s_select";

            }
            this._Select(dom);
        },

        classIndexOfTags:function(className,tagName,dom){
            var index,
                tags = dom.getElementsByTagName('li');
            for(var i= 0,len=tags.length;i<len;i++){
                if(tags[i].className==className)
                    index = i;
            }
            return index;
        },

        /*初始化*/
        init:function(conf){
            for(i in conf) this.opt[i] = conf[i];
            this.Dom = this.getDom('#'+this.opt['id']);

            this._buildSearch();
            this._bindEvent();

//            console.log(this);
            return this.inputDom;
        },

        /*私有方法*/
        _response:function(){
            var z = this;
            return function(ar_){
                z._render(ar_);
            }
        },


        _buildSearch:function(){
            var html =
                '<div id="diigo_a_search">' +
                '<div class="d_s_type">Tag Search</div>' +
                    '<div class="d_s_typeselect" style="position: absolute;width: 150px;left: 0px;background:#c1c1c1;min-height: 10px;display: none">' +
                        '<ul><li id="d_s_tag_search">Tag Search</li>' +
                        '<li id="d_s_meta_search">Meta search</li>' +
                        '<li id="d_s_full_search">Full text search</li></ul>' +
                    '</div>' +
                '<input type="text" class="d_s_input" name="q" autocomplete="off"/>' +
                '<div class="d_s_seachicon"></div>' +
                '<div class="d_s_autosuggess" style="position: absolute;width: 300px;left: 50px;background: rosybrown;min-height: 10px;display: none"></div> ' +
                '</div>';
            this.Dom.innerHTML = html;
            this.typeDom = this.getDom(".d_s_type",this.Dom);
            this.typeSelectDom = this.getDom(".d_s_typeselect",this.Dom);
            this.inputDom = this.getDom(".d_s_input",this.Dom);
            this.searchIconDom = this.getDom(".d_s_seachicon",this.Dom);
            this.autoSuggestionsDom = this.getDom(".d_s_autosuggess",this.Dom);
        },

        _render:function(value){
            console.log(value);
            this.autoSuggestionsDom.style.display = "";
            var inputText = this.inputDom.value;
            if(inputText.length<1){
                this.autoSuggestionsDom.style.display = "none";
                return;
            }





            var html = '<ul>';
//            for(var i= 0,len=value.length;i<len;i++){
//                html += "<li>Tags: <span class='d_s_tag'>"+value[i]+"</span></li>";
//            }
//            html+='<li>Meta: <span class="d_s_meta">'+inputText+'</span> </li> ' +
//                  '<li>Full text: <span class="d_s_full">'+inputText+'</span></li> ';
//            html+='</ul>';
//
            var meta ="",
                full ="",
                tags="";
            for(var i = 0,len=value.length;i<len;i++){
                tags +="<li>Tags: <span class='d_s_tag'>"+value[i]+"</span></li>";
            }

            var words = inputText.split(" ");
            delete words[words.length-1];
            words = words.join(" ");
            if(this.typeDom.id =='d_s_type_full'){
                full +="<li>Full text: <span class='d_s_full'>"+inputText+"</span></li>";
                for(var i= 0,len=value.length;i<len;i++){
                    full+="<li>Full text: <span class='d_s_full'>"+words+" "+value[i]+"</span></li>"
                }
            }else{
                full = "<li>Full text: <span class='d_s_full'>"+inputText+"</span></li>";
            }

            if(this.typeDom.id == 'd_s_type_meta'){
                meta +='<li>Meta: <span class="d_s_meta">'+inputText+'</span> </li> ';
                for(var i= 0,len=value.length;i<len;i++){
                    meta+="<li>Meta: <span class='d_s_meta'>"+words+" "+value[i]+"</span></li>"
                }
            }else{
                meta ='<li>Meta: <span class="d_s_meta">'+inputText+'</span> </li> ';
            }
            if(this.typeDom.id =='d_s_type_full'){
                html += full+tags+meta;
            }else if(this.typeDom.id =='d_s_type_meta'){
                html += meta+tags+full;
            }else{
                html += tags+meta+full;
            }
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