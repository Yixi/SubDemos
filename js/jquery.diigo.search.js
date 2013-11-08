/**
 * Diigo.com
 * Author: Liuyixi
 * Date: 13-3-14
 * Time: AM10:45
 */

;(function($){
    $.fn.extend({
        'DiigoLSearch':function(option){
            return this.each(function(){
                if(!(this && this.tagName === 'INPUT' && this.type==='text')) return;

                if(this.controller)
                    this.controller.setOption(option);
                else{
                    if($.isPlainObject(option))
                        this.controller = new Controller(this,option);
                }
            });
        }
    });

    // Construct Method

    var Controller = function(input,option){
        this.option = $.extend(false,{
            //default options
            "width":'auto',
            "maxHeight":null,
            "itemHeight":null,
            "type":"Library",   //Library(advance search panel)  | Global  | null(only auto complete)
            "dtype":"meta",      // Default search type    "tag"/"full"/"meta"
            "ispremium":false,
            //data
            "data":[],
            "maxItems":10,
            "minLength":1,
            "mutil":false,
            "delay":300,

            //complete
            "complete":null,
            "typeChange":null,

            //WARN the "father" for the advance panel to get the root input view; this is a private option!!!
            "father":null
        },option);

        if(['tag','full','meta'].indexOf(this.option.dtype)<0){
            this.option.dtype = "meta";
        }

        _setupView.apply(this,[input]);
        _setupSuggestionView.apply(this);
    };

    var _setupView = function(input){
        var that = this;
        this.inputView = $(input);
        this.inputView
            .attr('autocomplete','off')
            .keyup(this._keyup=function(event){
                switch(event.keyCode){
                    case 13:  //enter
                    case 16:  //shift
                    case 17:  //ctrl
                    case 37:  //left
                    case 38:  //up
                    case 39:  //right
                    case 40:  //down
                        break;
                    case 9:   //tab
                        event.preventDefault();
                        break;
                    case 27: //esc
                        _emptySuggestionView.apply(that);
                        break;
                    default:
                        _suggestion.apply(that);
                        if(that.option.type=="Library"){
                            _anaMetaFiled.apply(that);
                            _anaTagsFiled.apply(that);
                        }
                }
            })
            .keydown(this._keydown = function(event){
                switch(event.keyCode){
                    case 38: //up
                        _move.apply(that,['up']);
                        event.preventDefault();
                        break;
                    case 40: //down
                        if(that.SuggestionView.is(":visible")===false){
                            that.show();
                        }else{
                            _move.apply(that,['down']);
                        }
                        break;
                    case 13: //enter
                        //TODO:begin to search
                        _emptySuggestionView.apply(that);
                        that.search();
                        break;
                    case 9:  //tab
                        if(that.option.type=="Library"){
                            event.preventDefault();
                            _move.apply(that,['down']);
                        }else{
                            _emptySuggestionView.apply(that);
                        }
                        break;
                }
            })
            .blur(this._blur = function(){
                $(document).one('click',function(){
                    _emptySuggestionView.apply(that);
                });
            });

        if(this.option.type==="Library"){
            _setupLibrarySearchPanel.apply(that);
        }

        $(window).resize(function(){
           _reLocateViews.apply(that);
        });
    };

    var _setupLibrarySearchPanel = function(){
        var that = this;

        this.inputView.wrap('<span class="diigols_box"></span>').css('float','left').css('border','none');
        var _h = this.inputView.outerHeight();
        this.SearchPanel = this.inputView.parent().css('position','relative');
        this.typeView = $('<span class="dls_type"><span>&nbsp;</span></span>').css('height',_h).css('line-height',_h+"px");
        this.advanceIcon= $('<span class="dls_adv"><b>&nbsp;</b></span> ').css('height',_h).css('line-height',_h+"px");
        this.SearchPanel.prepend(that.typeView);
        this.SearchPanel.append(that.advanceIcon);

        this.typeView.attr('id','dls_type_tag');  //default search tag.

        _setupAdvancePanel.apply(this);
        _setupTypeSelectView.apply(this);
    };

    var _setupTypeSelectView = function(){
        var that = this;
        this.TypeSelectView = $("<div class='dls_list dls_type_list'><ul><li val='tag'><span class='dls_tag_icon'>&nbsp;</span>Tag Search</li><li val='meta'><span class='dls_meta_icon'>&nbsp;</span>Meta Search</li><li val='full'><span class='dls_full_icon'>&nbsp;</span>Full text Search</li></ul></div> ")
            .on('mouseenter','li',function(){
                that.TypeSelectView.find('li.selected').removeClass("selected");
                $(this).addClass("selected");
            })
            .on('mouseleave','li',function(){
                $(this).removeClass('selected');
            })
            .on('click','li',function(e){
                var type = $(this).attr('val');
                switch(type){
                    case 'tag':
                        _ChangeType.apply(that,["tag"]);
                        break;
                    case 'meta':
                        _ChangeType.apply(that,["meta"]);
                        break;
                    case 'full':
                        _ChangeType.apply(that,["full"]);
                        break;
                }
                if($.isFunction(that.option.typeChange)){
                    that.option.typeChange(type);
                }
                if($.trim(that.inputView.val()).length>0){
                    that.search();
                }
            })
            .css('font-size',this.typeView.css('font-size'))
            .hide();

        this.typeView
            .click(function(e){
                if(that.TypeSelectView.is(':visible')){
                    that.TypeSelectView.hide().detach();
                }else{
                    that.TypeSelectView.appendTo(document.body).show(10,function(){
                        $(document).one('click',function(){
                            that.TypeSelectView.hide().detach();
                        });
                    });

                }
            });
        var top = this.typeView.offset().top + this.typeView.outerHeight();
        var left =this.typeView.offset().left;
        this.TypeSelectView.css("top",top+"px").css("left",left-1+"px").css('position',"absolute");

        if(this.option.dtype==="full"){
            _ChangeType.apply(that,["full"]);
        }else if(this.option.dtype==="meta"){
            _ChangeType.apply(that,["meta"]);
        }else if(this.option.dtype==="tag"){
            _ChangeType.apply(that,["tag"]);
        }
    };

    var _ChangeType = function(type){
        var that = this;
        var title;
        if(type === "full"){
            title = "Search in Full-Text";
            that.typeView.attr('id','dls_type_full').attr("title",title);
            that.inputView.attr("placeholder",title);
            _fillAdvancePanel.apply(that,['full']);
            _anaMetaFiled.apply(that);
        }else if(type === "meta"){
            title = "Search in Title, URL, Annotations & Tags";
            that.typeView.attr('id','dls_type_meta').attr("title",title);
            that.inputView.attr("placeholder",title);
            _fillAdvancePanel.apply(that,['meta']);
            _anaMetaFiled.apply(that);
        }else if(type === "tag"){
            title = "Search in Tags";
            that.typeView.attr('id','dls_type_tag').attr("title",title);
            that.inputView.attr("placeholder",title);
            _fillAdvancePanel.apply(that,['tag']);
            _anaTagsFiled.apply(that);
        }
    };

    var _setupAdvancePanel = function(){
        var that =this;
        this.adVancePanel = $('<div class="dls_advpanel dls_list"></div>').hide();

        this.adVancePanel
            .on('input','input',function(e){
                _fillInput.apply(that);
            })
            .keydown(this._keydown = function(event){
                if(event.keyCode==13){// enter
                    that.search();
                }
            })
            .on("click",".dls_advpanel_search",function(e){
               that.search();
            });




        this.advanceIcon
            .click(function(e){
                var z=this;
                if(that.adVancePanel.is(':visible')){
                    that.adVancePanel.hide().detach();
                    $(z).toggleClass('dls_adv_show');
                }else{
                    that.adVancePanel.appendTo(document.body).show(10,function(){
                        $(document).on('click', that.hideevent = function(e){
                            if($(e.target).parents(".dls_advpanel").length<1 && $(e.target).parents("li.selected").length<1){
                                that.adVancePanel.hide().detach();
                                $(z).toggleClass('dls_adv_show');
                                $(document).unbind('click',that.hideevent);
                            }
                        });
                    });
                }
                $(this).toggleClass('dls_adv_show');
                _anaTagsFiled.apply(that);
                _anaMetaFiled.apply(that);
            });




        var top = this.SearchPanel.offset().top + this.SearchPanel.outerHeight();
        var left = this.SearchPanel.offset().left;
        this.adVancePanel.css("top",top-1+"px").css("left",left+"px").css('position',"absolute").css('width',_calcWidth.apply(this));
        _fillAdvancePanel.apply(this,['tag']);
    };

    var _fillInput = function(){
        var that =this;
        this.fillinput = _fillInput;
        if(that.adVancePanel.is('.dls_tag')){
            var _and,
                _or,__or=[],
                _not,__not=[];

            var andtext = that.adVancePanel.find('input[name=tagAND]').val();
            var ortext = that.adVancePanel.find('input[name=tagOR]').val();
            var nottext = that.adVancePanel.find('input[name=tagNOT]').val();

            _and = _parseTags.apply(that,[andtext]);
            _or = _parseTags.apply(that,[ortext]);
            _not = _parseTags.apply(that,[nottext]);
            var i,len;
            for(i= 0,len=_or.length;i<len;i++){
                __or.push('OR');
                __or.push(_or[i]);
            }
            __or.shift();
            if(__or.length<2) __or=[];
            for( i= 0,len=_not.length;i<len;i++){
                __not.push("NOT");
                __not.push(_not[i]);
            }

            var field = _unparseTags.apply(that,[_and.concat(__or,__not)]);

            that.inputView.val(field);

            __not.length=0;
            _not.length=0;
            __or.length=0;
            _or.length=0;
            _and.length=0;

        }else{
            var alltext,tagtext,urltext,fulltext;
            if(that.adVancePanel.is('.dls_meta')){
                alltext = $.trim(that.adVancePanel.find('.dls_meta_inner input[name=all]').val());
                tagtext = $.trim(that.adVancePanel.find('.dls_meta_inner input[name=tag]').val());
                urltext = $.trim(that.adVancePanel.find('.dls_meta_inner input[name=URL]').val());
            }else if(that.adVancePanel.is('.dls_full')){
                alltext = $.trim(that.adVancePanel.find('.dls_full_inner input[name=all]').val());
                tagtext = $.trim(that.adVancePanel.find('.dls_full_inner input[name=tag]').val());
                urltext = $.trim(that.adVancePanel.find('.dls_full_inner input[name=URL]').val());
                fulltext = $.trim(that.adVancePanel.find('.dls_full_inner input[name=fulltext]').val());
            }

//            var tag = "";
            tagtext = tagtext.length > 0 ? "#"+ _splitQuery(tagtext).join(" #") : "";
            urltext = urltext.length > 0 ? "@"+ _splitQuery(urltext).join(" @") : "";
            var field = (alltext.length>0 ? alltext+" ":"") + (tagtext.length>0 ? tagtext+" ":"")+ (that.adVancePanel.is('.dls_full')===true?(fulltext.length>0 ? "text:("+fulltext+") " : ""):"") + (urltext.length>0 ? urltext+" ":"");
            that.inputView.val(field);

        }
    };


    var _fillAdvancePanel = function(type){
        var that = this;
        if(this.adVancePanel.html().length<2){
            var metapanel = '<div class="dls_meta_inner" style="display: none">'+
                '<div class="dls_advpanel_title">Advanced Search</div>' +
                '<div><p>all these words anywhere:</p><p><input type="text" name="all" /></p></div>' +
                '<div><p>words in Tags:</p><p><input type="text" name="tag"/></p></div>' +
                '<div><p>words in URL:</p><p><input type="text" name="URL"/></p></div>' +
                '<div class="dls_advpanel_search"><a href="javascript:void(0)" class="dls_search"></a></div>' +
                '</div>';

            var fullpanel = '<div class="dls_full_inner" style="display: none">'+
                '<div class="dls_advpanel_title">Advanced Search</div>' +
                '<div><p>all these words anywhere:</p><p><input type="text" name="all" /></p></div>' +
                '<div><p>words in Tags:</p><p><input type="text" name="tag"/></p></div>' +
                '<div><p>words in Full-Text</p><p><input type="text" name="fulltext"/></p></div>' +
                '<div><p>words in URL:</p><p><input type="text" name="URL"/></p></div>' +
                '<div class="dls_advpanel_search"><a href="javascript:void(0)" class="dls_search"></a></div>' +
                '</div>';

            var tagpanel ='<div class="dls_tag_inner" style="display: none">'+
                '<div class="dls_advpanel_title">Advanced Search</div>' +
                '<div><p>all these tags:</p><p><input type="text" name="tagAND"/></p></div>' +
                '<div><p>any of these tags:</p><p><input type="text" name="tagOR" /></p></div>' +
                '<div><p>none of these tags:</p><p><input type="text" name="tagNOT" /></p></div>' +
                '<div class="dls_advpanel_search"><a href="javascript:void(0)" class="dls_search"></a></div>' +
                '</div>';
            this.adVancePanel.html(metapanel+fullpanel+tagpanel);

            this.adVancePanel.find('input[name=tagAND],input[name=tagOR],input[name=tagNOT]').DiigoLSearch({
                type:"panel",
                data:that.option.data,
                mutil:true,
                father:this
            });

        }

        if(type=='tag'){
//            this.adVancePanel.html(tagpanel).removeClass('dls_meta dls_full').addClass('dls_tag');
            this.adVancePanel.removeClass('dls_meta dls_full').addClass('dls_tag');
            this.adVancePanel.find('.dls_full_inner,.dls_meta_inner').hide();
            this.adVancePanel.find('.dls_tag_inner').show();
        }else if(type=='meta'){
//            this.adVancePanel.html(metapanel).removeClass('dls_tag dls_full').addClass('dls_meta');
            this.adVancePanel.removeClass('dls_tag dls_full').addClass('dls_meta');
            this.adVancePanel.find('.dls_full_inner,.dls_tag_inner').hide();
            this.adVancePanel.find('.dls_meta_inner').show();
        }else{
//            this.adVancePanel.html(fullpanel).removeClass('dls_meta dls_tag').addClass('dls_full');
            this.adVancePanel.removeClass('dls_meta dls_tag').addClass('dls_full');
            this.adVancePanel.find('.dls_tag_inner,.dls_meta_inner').hide();
            this.adVancePanel.find('.dls_full_inner').show();
        }


    };

    var _anaTagsFiled = function(){
        var that = this;
        if(this.adVancePanel.is('.dls_tag') && this.adVancePanel.is(':visible')){
            var inputField = this.inputView.val();
            this.adVancePanel.find('input[name=tagAND]').val(inputField);
//            var tags = _parseTags.apply(that,[inputField]);
//            var flag = 0; //0 is AND ; 1 is OR; -1 is NOT;
//            var _and = [],
//                _or = [],
//                _not = [];
//            for(var i= 0,len=tags.length;i<len;i++){
//                switch(tags[i]){
//                    case 'OR':
//                        flag=1;
//                        break;
//                    case 'NOT':
//                        flag=-1;
//                        break;
//                    default :
//                        if(flag==1){
//                            if(tags[i-2]){
//                                if(tags[i-1]!="OR" && tags[i-1]!="NOT")
//                                    _or.push(tags[i-2]);
//                                if(tags[i-2]==_and[_and.length-1]){
//                                    _and.pop();
//                                }
//                            }
//                            _or.push(tags[i]);
//
//                        }else if(flag==-1){
//                            _not.push(tags[i]);
//                        }else{
//                            _and.push(tags[i]);
//                        }
//                        flag=0;
//                        break;
//                }
//            }
//            this.adVancePanel.find('input[name=tagAND]').val(_unparseTags.apply(that,[_and]));
//            this.adVancePanel.find('input[name=tagOR]').val(_unparseTags.apply(that,[_or]));
//            this.adVancePanel.find('input[name=tagNOT]').val(_unparseTags.apply(that,[_not]));
        }
    };

    var _anaMetaFiled =function(){
        var that = this;
        if((this.adVancePanel.is('.dls_meta') || this.adVancePanel.is('.dls_full')) && this.adVancePanel.is(":visible")){
            var inputFiled = $.trim(that.inputView.val()),
                r = _analyMeta(inputFiled);
            this.adVancePanel.find('input[name=all]').val(r.meta);
            this.adVancePanel.find('input[name=tag]').val(r.tag);
            this.adVancePanel.find('input[name=URL]').val(r.url);
            this.adVancePanel.find('input[name=fulltext]').val("");
        }
    };


    var _setupSuggestionView = function(){
        var that = this;
        this.SuggestionView = $("<div class='dls_list dls_suggestion_list'><ul></ul></div> ")
            .on('mouseenter','li',function(){
                that.SuggestionView.find('li.selected').removeClass("selected");
                $(this).addClass('selected');
            })
            .on('mouseleave','li',function(){
                $(this).removeClass('selected');
            })
            .on('click','li',function(e){
                var complete,thistype;
                if(that.option.type=="Library"){
                    var currenttype = that.typeView.attr('id').replace("dls_type_","");
                    thistype = $(this).find('div span:eq(0)').attr('class').replace(/(dls_|_icon)/g,"");
                    if (currenttype!=thistype || thistype=="edittag")
                        complete = true;
                }
                _select.apply(that);
                _emptySuggestionView.apply(that);
                that.inputView.focus();
                if(complete)
                    if(thistype=="edittag")
                        that.search("edittag");
                    else
                        that.search();
            })
            .css('font-size',this.inputView.css('font-size'));

    };

    var _move = function(dir){
        var selected = this.SuggestionView.find('li.selected');
        var nextSelected;
        if(selected.length>0){
             nextSelected = dir ==='up'? selected.prev() : selected.next();
        }else{
             nextSelected = dir ==='up'? this.SuggestionView.find('li').last('li') : this.SuggestionView.find('li').first('li');
        }
        if(nextSelected.length>0){
            if(nextSelected[0].tagName.toLowerCase()=='hr'){
                 nextSelected = dir ==='up'? nextSelected.prev() : nextSelected.next();
            }
            this.SuggestionView.find('li').removeClass("selected");
            nextSelected.addClass("selected");
        }
        _select.apply(this);
    };

    var _createItems = function(result){
        var that = this,
            container = this.SuggestionView.find('ul').empty();
        if($.isNumeric(that.option.maxItems)) result = result.slice(0,that.option.maxItems);
        else result = result.slice(0,10);
        var html="",
            tags="",
            meta="",
            full="";

        //TODO: maybe need to support the option mutil value spliter;
        var words = _parseTags.apply(this,[this.inputView.val()]);

        var lastwords =words[words.length-1];
        var showforlast = _unparseTags.apply(this,[[lastwords]]);
        words.length = words.length-1;
        words = _unparseTags.apply(this,[words]);

        if(!!this.option.mutil===false) {
            lastwords = this.inputView.val();
            words="";
        }

        if(this.option.type==="Library"){
            meta +='<li val=\''+lastwords+'\'><div><span class="dls_meta_icon"></span>'+((that.typeView.attr('id')=="dls_type_meta")?'<span>'+words+" "+showforlast+'</span>':'Search in Title, URL, Annotations & Tags<span></span>')+'</div></li> ';
            full +='<li val=\''+lastwords+'\'><div><span class="dls_full_icon"></span>'+((that.typeView.attr('id')=="dls_type_full")?'<span>'+words+" "+showforlast+'</span>':'Search in Full-Text'+((that.option.ispremium===true||that.option.ispremium=='true')?'':'(Upgrade to enable)')+'<span></span>')+'</div></li> ';
            tags +='<li val=\''+lastwords+'\'><div><span class="dls_tag_icon"></span>'+((that.typeView.attr('id')=="dls_type_tag")?'':'Search in Tags')+'<span></span></div></li> ';
            if(that.typeView.attr('id')=="dls_type_tag")
                tags="";
        }else{
            tags="";
        }
        $.each(result,function(index,data){
//            var item = $("<li><div></div></li>").appendTo(container).attr("val",data).find("div");
//            item.append("<span>"+data+"</span>");
            if(that.option.type==="Library"){
                if(that.typeView.attr('id')=="dls_type_tag")
                    tags += '<li val=\''+data+'\'><div><span class="dls_tag_icon"></span><span>'+data+'</span></div></li>';
                if(that.typeView.attr('id')=="dls_type_meta")
                    meta += '<li val="'+data+'"><div><span class="dls_meta_icon"></span><span>'+words+" "+data+'</span></div></li>';
//                if(that.typeView.attr('id')=="dls_type_full")
//                    full += '<li val="'+data+'"><div><span class="dls_full_icon"></span><span>'+words+" "+data+'</span></div></li> ';
            }else{
                tags += '<li val=\''+data+'\'><div><span class="dls_tag_icon"></span><span>'+data+'</span></div></li>';
            }
        });
        if(this.option.type==="Library"){

            if(this.typeView.attr('id')=='dls_type_meta'){
                html = meta+'<hr />'+tags+full;
            }else if(this.typeView.attr('id')=='dls_type_full'){
                html = full+'<hr />'+tags+meta;
            }else{
                if(tags.length<1){
                    html = meta+full;
                }else{
                    html = tags+'' +
                        '<li val=\''+lastwords+'\' class="edittag"><div><span class="dls_edittag_icon"></span><span>edit these tags</span></div></li>' +
                        '<hr />'+meta+full;
                }
            }
            $(html).appendTo(container);

        }else{
            $(tags).appendTo(container);
        }


    };
    var _calcWidth = function(){
        if(typeof(this.option.width)==='string' && this.option.width.toLowerCase()==='auto'){
            if(this.option.type === 'Library'){
                return this.SearchPanel.outerWidth() -2;
            }else{
                return this.inputView.outerWidth() -2;
            }
        }else if(typeof(this.option.width)==='number'){
            return this.option.width;
        }

    };

    var _locateSuggestionView = function(){
        //定位补全列表
        var top,left;
        if(this.option.type ==='Library'){
             top = this.SearchPanel.offset().top + this.SearchPanel.outerHeight();
             left = this.SearchPanel.offset().left;
        }else{
             top = this.inputView.offset().top + this.inputView.outerHeight();
             left =this.inputView.offset().left;
        }
        this.SuggestionView.css("top",top-1+"px").css("left",left+"px").css('position',"absolute").css('zIndex',"10010");

    };

    var _reLocateViews = function(){
        var s_top,s_left;
        if(this.option.type === 'Library'){
             s_top = this.SearchPanel.offset().top + this.SearchPanel.outerHeight();
             s_left = this.SearchPanel.offset().left;

            var t_top = this.typeView.offset().top + this.typeView.outerHeight();
            var t_left = this.typeView.offset().left;
            this.TypeSelectView.css("top",t_top+"px").css("left",t_left-1+"px").css('position',"absolute");

            this.adVancePanel.css("top",s_top-1+"px").css("left",s_left+"px").css('position',"absolute").css('width',_calcWidth.apply(this));

        }else{
             s_top = this.inputView.offset().top + this.inputView.outerHeight();
             s_left =this.inputView.offset().left;
        }
        this.SuggestionView.css("top",s_top-1+"px").css("left",s_left+"px").css('position',"absolute");
    };

    var _showSuggestionView = function(result){
        var that =this;
        if(this.option.type!="Library" && result.length===0){
            _emptySuggestionView.apply(that);
        }else{
            _createItems.apply(that,[result]);
            _locateSuggestionView.apply(that);

            this.SuggestionView.css("width",_calcWidth.apply(this)+'px');
//            this.SuggestionView.show();
            this.SuggestionView.appendTo(document.body).show();
        }

    };

    var _emptySuggestionView = function(){
        this.SuggestionView.find('ul').empty();
        this.SuggestionView.hide().detach();
    };


    var _suggestion = function(){
        var that = this,
            keyword,
            data =[],
            result = [];

        if(!!this.option.mutil===false){
            keyword = this.inputView.val();
        }else{
            var vals = _parseTags.apply(this,[this.inputView.val()]);
            keyword = vals[vals.length-1];
        }
        if($.trim(keyword).length===0){
            _emptySuggestionView.apply(that);
            return;
        }
        if($.isArray(this.option.data)){
            _showSuggestionView.apply(that,[_filter(that.option.data,keyword)]);
        }else if($.isFunction(this.option.data)){
            that.option.data(keyword,function(result){_showSuggestionView.apply(that,[result]);});
        }
    };

    var _select=function(){
        var that =this;
        var selected = this.SuggestionView.find('li.selected');
        if(selected.length>0){
            if(!!this.option.mutil ===false){
                this.inputView.val(selected.attr('val'));
            }else if(this.option.mutil===true){
                var vals = _parseTags.apply(this,[this.inputView.val()]);
                vals[vals.length-1] = selected.attr('val');
                this.inputView.val(_unparseTags.apply(this,[vals]));
            }else{
                var vals = _parseTags.apply(this,[this.inputView.val()]);
                vals[vals.length-1] = selected.attr('val');
                this.inputView.val(_unparseTags.apply(this,[vals,this.options.mutil]));
            }
        }
        if(this.option.type=="Library"){
            if(selected.find("span.dls_tag_icon").length>0){
    //            that.typeView.attr('id','dls_type_tag');
                that.typeView.attr('id','dls_type_tag');
                _fillAdvancePanel.apply(that,['tag']);
                _anaTagsFiled.apply(that);
            }else if(selected.find("span.dls_meta_icon").length>0){
                that.typeView.attr('id','dls_type_meta');
                _fillAdvancePanel.apply(that,['meta']);
                _anaMetaFiled.apply(that);
            }else if(selected.find("span.dls_full_icon").length>0){
                that.typeView.attr('id','dls_type_full');
                _fillAdvancePanel.apply(that,['full']);
                _anaMetaFiled.apply(that);
            }else if(selected.find("span.dls_edittag_icon").length>0){
                that.typeView.attr('id','dls_type_edittag');
            }
        }else if(this.option.type=="panel"){
            if(this.option.father){
                this.option.father.fillinput.apply(this.option.father);
            }
        }
    };


    /*new function to parseTags and query  */

    var _analyMeta = function(str){
        if(!str) return [];
        if(!/#|@/.test(str)){
            return {
                meta:str,
                tag:"",
                url:""
            };
        }
        var terms = _splitQuery(str),
            pos = 0,
            ret = {
                meta:"",
                tag:"",
                url:""
            },
            ret_tags = [],
            ret_links = [],
            ret_meta =[];
        for(var len=terms.length;pos < len;){
            var term = terms[pos];
            var syntax = term.charAt(0);
            if(syntax == '"'){
                ret_meta.push(_filter_char(term));
            }else if(syntax == '@'){
                ret_links.push(_filter_url(term));
            }else if(syntax == '#'){
                ret_tags.push(_filter_tag(term));
            }else{
                ret_meta.push(_filter_char(term));
            }
            pos++;
        }

        ret.meta = ret_meta.join(" ");
        ret.tag = ret_tags.join(" ");
        ret.url = ret_links.join(" ");
        return ret;
    };

    /*filter char */
    var fc_reg= /[\"\/\?\\!&%~{}]/g;
    var _filter_tag = function(str){
        return str.substring(1,str.length);
    };
    var _filter_url = function(str){
        return str.substring(1,str.length);
    };
    var _filter_char = function(str){
        if(!str) return "";
        str = str.replace(fc_reg," ");
        return str;
    };

    /**
     * split the query by double quotation marks
     * @param str
     * @returns {Array}
     * @private
     */
    var _splitQuery = function(str){
        if(!str) return [];
        str = str
            .replace(/\s+/g," ")
            .replace(/^\s+|\s+$/g, '');  //merge the space and trim string.
        var terms = str.split(" ");
        terms = _compensateQuote(terms);
        return terms;
    };
    /**
     * compensate the quote and return the right split of the query.
     * @param terms{Array}
     * @returns {Array}
     * @private
     */
    var _compensateQuote = function(terms){
        var ret = [],
            pos = 0;
        while( pos < terms.length){
            var term = terms[pos],
                syntax = term.charAt(0),
                term_q = term,
                next_q = false;
            if (syntax == '"'){
                if( !(term.charAt(term.length-1) == '"' && term.length > 1) ){
                    next_q = true;
                }
            }else if(/#|@/.test(syntax)){
                if(term.length > 2 && term.charAt(1) == '"'){
                    if( !(term.charAt(term.length -1) == '"' && term.length > 2) ){
                        next_q = true;
                    }
                }
            }
            if(next_q){
                var pos_e = pos + 1;
                while (pos_e < terms.length){
                    var t = terms[pos_e];
                    term_q  = term_q + " " + t;
                    if(t.charAt(t.length -1) == '"'){
                        break;
                    }
                    pos_e +=1;
                }
                if(pos_e >= terms.length && term_q.charAt(term_q.length -1 ) != '"'){
                    term_q = term;
                }else{
                    pos = pos_e;
                }
            }
            pos += 1;
            ret.push(term_q);
        }
        return ret;
    };


    var _parseTags = function(strTags){
        var stack = [],tags=[];
        var begin_delimiter = false;


        function clearStack(){
            if(stack.length>0){
                tags.push(stack.join(''));
                stack.length=0;
            }
        }

        for(var i= 0,len=strTags.length,c;c = strTags.charAt(i),i<len;i++){
            if(c=='"'){
                if(!begin_delimiter)
                    begin_delimiter = true;
                else{
                    begin_delimiter = false;
                    clearStack();
                }
            }else{
                if(begin_delimiter){
                    stack.push(c);
                }else{
                    var con;
                    if(this.option.mutil===true)
                       con = /\s/.test(c);
                    else
                       con = (c== this.option.mutil);
                    if(con)
                        clearStack();
                    else
                        stack.push(c);
                }
            }
        }
        clearStack();
        return tags;

    };

    var _unparseTags = function(tagArray,joinBy){

        function quoteTag(tag){
            tag = tag
                .replace(/"/g, "'")
                .replace(/\s+/g, ' ')
                .replace(/^\s+|\s+$/g, '');

            if (tag.match(/\s+|,/)) {
                tag = '"' + tag + '"';
            }
            return tag;
        }
        joinBy = joinBy || ' ';

        return $.map(tagArray,function(t){return quoteTag(t);},this).join(joinBy);
    };



    var _escapeRegex = function(value){
        return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    };

    var _filter = function(array,term){
        var matcher = new RegExp(_escapeRegex(term),"i");
        var match =  $.grep(array,function(value){
            return matcher.test(value);
        });
        var tlen = term.length;
        var len = match.length;
        var r1=[],r2=[],r3=[];
        for(var i=0;i<len;i++){
            if(match[i].slice(0,tlen).toLowerCase() == term.toLowerCase() ){
                if(match[i].toLowerCase()==term.toLowerCase())
                    r1.push(match[i]);
                else
                    r2.push(match[i]);
            }else{
                r3.push(match[i]);
            }
        }

        var r = $.merge($.merge(r1,r2),r3);
        return r;
    };
    //Public method



    Controller.prototype.setOption = function(option){
        if($.isPlainObject(option)){
            this.option = $.extend(false,this.option,option);
            if(!this.option.father){
                _reLocateViews.apply(this);
                if(this.option.type=="Library"){
                    this.adVancePanel.find('input[name=tagAND],input[name=tagOR],input[name=tagNOT]').DiigoLSearch({
                        data:this.option.data
                    });
                }
            }
        }else if(typeof(option)==='string'){
            switch(option){
                case 'destroy':
                    this.destory();
                    break;
                case 'show':
                    this.show();
                    break;
                case 'search':
                    this.search();
                    break;
            }
        }
    };


    Controller.prototype.search = function(){
        var that =this;
        var type = that.typeView && that.typeView.attr('id').replace('dls_type_',"");
        if(type == "edittag"){
            if(that.SuggestionView.find('li.selected span.dls_edittag_icon').length>0)
                type="edittag";
            else
                type="tag";
        }
        if(arguments[0]=="edittag")
            type="edittag";
        if(type==undefined) type="tag";
        var json = {
            "type": type,
            "value":that.inputView.val()
        };
        if($.isFunction(that.option.complete)){
            that.option.complete(json);
        }
    };
    Controller.prototype.destory = function(){
        this.SuggestionView.remove();
        this.inputView.unbind('keyup',this._keyup).unbind('keydown',this._keydown).unbind('blur',this._blur);
        delete this.inputView.get(0).controller;
    };
    Controller.prototype.show = function(){
        _suggestion.apply(this);
    };



})(jQuery);



