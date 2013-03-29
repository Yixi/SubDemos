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
    })

    // Construct Method

    var Controller = function(input,option){
        this.option = $.extend(false,{
            //default options
            "width":'auto',
            "maxHeight":null,
            "itemHeight":null,
            "type":"Library",   //Library(advance search panel)  | Global  | null(only auto complete)
            //data
            "data":[],
            "maxItems":10,
            "minLength":1,
            "mutil":false,
            "delay":300,

            //complete
            "complete":null

        },option);

        _setupView.apply(this,[input]);
        _setupSuggestionView.apply(this);
    }

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
                    case 27: //esc
                        _emptySuggestionView.apply(that);
                        break;
                    default:
                        _suggestion.apply(that);
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
                        break
                    case 13: //enter
                        //TODO:begin to search

                        var json = {
                            "type": that.typeView && that.typeView.attr('id').replace('dls_type_',""),
                            "value":that.inputView.val()
                        };
                        if($.isFunction(that.option.complete)){
                            that.option.complete(json);
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
    }

    var _setupLibrarySearchPanel = function(){
        var that = this;

        this.inputView.wrap('<span class="diigols_box"></span>').css('float','left').css('border','none');
        var _h = this.inputView.outerHeight()
        this.SearchPanel = this.inputView.parent().css('position','relative');
        this.typeView = $('<span class="dls_type"><span>&nbsp;</span></span>').css('height',_h).css('line-height',_h+"px");
        this.advanceIcon= $('<span class="dls_adv"><b>&nbsp;</b></span> ').css('height',_h).css('line-height',_h+"px");
        this.SearchPanel.prepend(that.typeView);
        this.SearchPanel.append(that.advanceIcon);

        this.typeView.attr('id','dls_type_tag');  //default search tag.

        _setupAdvancePanel.apply(this);
        _setupTypeSelectView.apply(this);
    }

    var _setupTypeSelectView = function(){
        var that = this;
        this.TypeSelectView = $("<div class='dls_list dls_type_list'><ul><li val='tag'><span class='dls_tag_icon'>&nbsp;</span>Tag Search</li><li val='meta'><span class='dls_meta_icon'>&nbsp;</span>Meta Search</li><li val='full'><span class='dls_full_icon'>&nbsp;</span>Full text Search</li></ul></div> ")
            .appendTo(document.body)
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
                        that.typeView.attr('id','dls_type_tag');
                        _fillAdvancePanel.apply(that,['tag']);
                        break;
                    case 'meta':
                        that.typeView.attr('id','dls_type_meta');
                        _fillAdvancePanel.apply(that);
                        break;
                    case 'full':
                        that.typeView.attr('id','dls_type_full');
                        _fillAdvancePanel.apply(that);
                        break;
                }
            })
            .css('font-size',this.typeView.css('font-size'))
            .hide();

        this.typeView
            .click(function(e){
                if(that.TypeSelectView.is(':visible')){
                    that.TypeSelectView.hide();
                }else{
                    that.TypeSelectView.show(10,function(){
                        $(document).one('click',function(){
                            that.TypeSelectView.hide();
                        })
                    });

                }
            });
        var top = this.typeView.offset().top + this.typeView.outerHeight();
        var left =this.typeView.offset().left;
        this.TypeSelectView.css("top",top+"px").css("left",left-1+"px").css('position',"absolute");
    }

    var _setupAdvancePanel = function(){
        var that =this;
        this.adVancePanel = $('<div class="dls_advpanel dls_list"></div>').appendTo(document.body).hide();

        this.advanceIcon
            .click(function(e){
//                if(that.adVancePanel.is(':visible')){
//                    that.adVancePanel.hide();
//                }else{
////                    that.adVancePanel.show(10,function(){
////                        $(document).one('click',function(){
////                           that.adVancePanel.hide();
////                        });
////                    });
//                    that.adVancePanel.show();
//                }
                that.adVancePanel.toggle();
                $(this).toggleClass('dls_adv_show');
            });

        var top = this.SearchPanel.offset().top + this.SearchPanel.outerHeight();
        var left = this.SearchPanel.offset().left;
        this.adVancePanel.css("top",top-1+"px").css("left",left-1+"px").css('position',"absolute").css('width',_calcWidth.apply(this));
        _fillAdvancePanel.apply(this,['tag']);
    }

    var _fillAdvancePanel = function(type){
        var m_f = '<div class="dls_advpanel_title">Advanced Search</div>' +
            '<div><p>Tagged</p><p><input type="text" name="tag"/></p></div>' +
            '<div><p>Full text</p><p><input type="text" name="fulltext"/></p></div>' +
            '<div><p>URL</p><p><input type="text" name="URL"/></p></div>' +
            '<div><p>Title</p><p><input type="text" name="title"/></p></div>' +
            '<div><p>Description</p><p><input type="text" name="description00"/></p></div>' +
            '<div><p>Highlights</p><p><input type="text" name="highlights"/></p></div>' +
            '<div><p>Without the words</p><p><input type="text" name="without"/></p></div>' +
            '<div class="dls_advpanel_search"><a href="javascript:void(0)" class="dls_search"></a></div>';
        var tagpanel = '<div class="dls_advpanel_title">Advanced Search</div>' +
            '<div><p>AND</p><p><input type="text" name="tagAND"/></p></div>' +
            '<div><p>OR</p><p><input type="text" name="tagOR" /></p></div>' +
            '<div><p>NOT</p><p><input type="text" name="tagNOT" /></p></div>' +
            '<div class="dls_advpanel_search"><a href="javascript:void(0)" class="dls_search"></a></div>';
        if(type=='tag'){
            this.adVancePanel.html(tagpanel).removeClass('dls_meta').addClass('dls_tag');
        }else{
            this.adVancePanel.html(m_f).removeClass('dls_tag').addClass('dls_meta');
        }
    }

    var _setupSuggestionView = function(){
        var that = this;
        this.SuggestionView = $("<div class='dls_list dls_suggestion_list'><ul></ul></div> ")
            .appendTo(document.body)
            .on('mouseenter','li',function(){
                that.SuggestionView.find('li.selected').removeClass("selected");
                $(this).addClass('selected');
            })
            .on('mouseleave','li',function(){
                $(this).removeClass('selected');
            })
            .on('click','li',function(e){
                _select.apply(that);
                _emptySuggestionView.apply(that);
                that.inputView.focus();
            })
            .css('font-size',this.inputView.css('font-size'))
            .hide();



    }

    var _move = function(dir){
        var selected = this.SuggestionView.find('li.selected');
        if(selected.length>0){
            var nextSelected = dir ==='up'? selected.prev() : selected.next();
        }else{
            var nextSelected = dir ==='up'? this.SuggestionView.find('li').last('li') : this.SuggestionView.find('li').first('li');
        }
        if(nextSelected.length>0){
            if(nextSelected[0].tagName.toLowerCase()=='hr'){
                var nextSelected = dir ==='up'? nextSelected.prev() : nextSelected.next();
            }
            this.SuggestionView.find('li').removeClass("selected");
            nextSelected.addClass("selected");
        }
        _select.apply(this);
    }

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
        var words = this.inputView.val().split(" ");
        var lastwords = words[words.length-1];
        delete words[words.length-1];
        words = words.join(" ");

        if(!!this.option.mutil===false) {
            lastwords = this.inputView.val();
            words="";
        }

        meta +='<li val="'+lastwords+'"><div><span class="dls_meta_icon"></span>'+((that.typeView.attr('id')=="dls_type_meta")?'':'Meta:')+'<span>'+words+" "+lastwords+'</span></div></li> ';
        full +='<li val="'+lastwords+'"><div><span class="dls_full_icon"></span>'+((that.typeView.attr('id')=="dls_type_full")?'':'Full Text:')+'<span>'+words+" "+lastwords+'</span></div></li> ';
        tags +='<li val="'+lastwords+'"><div><span class="dls_tag_icon"></span>'+((that.typeView.attr('id')=="dls_type_tag")?'':'Tag:')+'<span>'+words+" "+lastwords+'</span></div></li> ';
        $.each(result,function(index,data){
//            var item = $("<li><div></div></li>").appendTo(container).attr("val",data).find("div");
//            item.append("<span>"+data+"</span>");
//
            if(that.typeView.attr('id')=="dls_type_tag")
                tags += '<li val="'+data+'"><div><span class="dls_tag_icon"></span><span>'+data+'</span></div></li>';
            if(that.typeView.attr('id')=="dls_type_meta")
                meta += '<li val="'+data+'"><div><span class="dls_meta_icon"></span><span>'+words+" "+data+'</span></div></li>';
            if(that.typeView.attr('id')=="dls_type_full")
                full += '<li val="'+data+'"><div><span class="dls_full_icon"></span><span>'+words+" "+data+'</span></div></li> ';

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
                    html = tags+'<hr />'+meta+full;
                }
            }
            $(html).appendTo(container);

        }else{
            $(tags).appendTo(container);
        }


    }
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

    }

    var _locateSuggestionView = function(){
        //定位补全列表
        if(this.option.type ==='Library'){
            var top = this.SearchPanel.offset().top + this.SearchPanel.outerHeight();
            var left = this.SearchPanel.offset().left;
        }else{
            var top = this.inputView.offset().top + this.inputView.outerHeight();
            var left =this.inputView.offset().left;
        }
        this.SuggestionView.css("top",top-1+"px").css("left",left+"px").css('position',"absolute");

    }

    var _showSuggestionView = function(result){
        var that =this;

        _createItems.apply(that,[result]);
        _locateSuggestionView.apply(that)

        this.SuggestionView.css("width",_calcWidth.apply(this)+'px');

        this.SuggestionView.show();
    }

    var _emptySuggestionView = function(){
        this.SuggestionView.find('ul').empty();
        this.SuggestionView.hide();
    }

    var _suggestion = function(){
        var that = this,
            keyword,
            data =[],
            result = [];

        if(!!this.option.mutil===false){
            keyword = this.inputView.val();
        }else if(this.option.mutil===true){
            var vals = this.inputView.val().split(" ");
            keyword = vals[vals.length-1];
        }else{
            var vals = this.inputView.val().split(this.option.mutil);
            keyword = vals[vals.length-1];
        }
        if($.trim(keyword).length==0){
            _emptySuggestionView.apply(that);
            return;
        }
        if($.isArray(this.option.data)){
            _showSuggestionView.apply(that,[_filter(that.option.data,keyword)]);
        }else if($.isFunction(this.option.data)){
            that.option.data(keyword,function(result){_showSuggestionView.apply(that,[result])});
        }
    }

    var _select=function(){
        var selected = this.SuggestionView.find('li.selected');
        if(selected.length>0){
            if(!!this.option.mutil ===false){
                this.inputView.val(selected.attr('val'));
            }else if(this.option.mutil===true){
                var vals = this.inputView.val().split(" ");
                vals[vals.length-1] = selected.attr('val');
                this.inputView.val(vals.join(" "));
            }else{
                var vals = this.inputView.val().split(this.option.mutil);
                vals[vals.length-1] = selected.attr('val');
                this.inputView.val(vals.join(this.option.mutil));
            }
        }
    }

    var _escapeRegex = function(value){
        return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    }

    var _filter = function(array,term){
        var matcher = new RegExp(_escapeRegex(term),"i");
        return $.grep(array,function(value){
            return matcher.test(value);
        });
    }
    //Public method

    Controller.prototype.setOption = function(option){
        if($.isPlainObject(option)){
            this.option = $.extend(false,this.option,option);
        }else if(typeof(option)==='string'){
            switch(option){
                case 'destroy':
                    this.destory();
                    break;
                case 'show':
                    this.show();
                    break;
            }
        }
    }
    Controller.prototype.destory = function(){
        this.SuggestionView.remove();
        this.inputView.unbind('keyup',this._keyup).unbind('keydown',this._keydown).unbind('blur',this._blur);
        delete this.inputView.get(0).controller;
    }
    Controller.prototype.show = function(){
        _suggestion.apply(this);
    }



})(jQuery);
