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
            "maxItems":20,
            "minLength":1,
            "mutil":false,
            "delay":300

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

        this.inputView.wrap('<span class="diigols_box"></span>').css('border','none');
        var _h = this.inputView.outerHeight()
        this.SearchPanel = this.inputView.parent().css('position','relative');
        this.typeView = $('<span class="dls_type">tag</span>').css('height',_h).css('line-height',_h+"px");
        this.searchIcon = $('<span class="dls_icon">Seach</span> ').css('height',_h).css('line-height',_h+"px");
        this.SearchPanel.prepend(that.typeView);
        this.SearchPanel.append(that.searchIcon);

        this.typeView.attr('id','dls_tag');  //default search tag.
        _setupTypeSelectView.apply(this);
    }

    var _setupTypeSelectView = function(){
        var that = this;
        this.TypeSelectView = $("<div class='dls_list dls_type_list'><ul><li>Tag Search</li><li>Meta Search</li><li>Full text Search</li></ul></div> ")
            .appendTo(document.body)
            .on('mouseenter','li',function(){
                that.TypeSelectView.find('li.selected').removeClass("selected");
                $(this).addClass("selected");
            })
            .on('mouseleave','li',function(){
                $(this).removeClass('selected');
            })
            .on('click','li',function(e){
                console.log(e);
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
        this.TypeSelectView.css("top",top+1+"px").css("left",left-1+"px").css('position',"absolute");
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
            var nextSelected = dir ==='up'? this.SuggestionView.find('li').last() : this.SuggestionView.find('li').first();
        }
        if(nextSelected.length>0){
            this.SuggestionView.find('li').removeClass("selected");
            nextSelected.addClass("selected");
        }
        _select.apply(this);
    }

    var _createItems = function(result){
        var that = this,
            container = this.SuggestionView.find('ul').empty();

        $.each(result,function(index,data){
            var item = $("<li><div></div></li>").appendTo(container).attr("val",data).find("div");
            item.append("<span>"+data+"</span>");

            if(that.option.itemHeight > 0 ){
                item.height(that.option.itemHeight).css('max-height',that.option.itemHeight);
            }
        });

    }
    var _calcWidth = function(){
        if(typeof(this.option.width)==='string' && this.option.width.toLowerCase()==='auto'){
            return this.inputView.outerWidth() -2;
        }else if(typeof(this.option.width)==='number'){
            return this.option.width;
        }

    }

    var _locateSuggestionView = function(){
        //定位补全列表
        var top = this.inputView.offset().top + this.inputView.outerHeight();
        var left =this.inputView.offset().left;
        this.SuggestionView.css("top",top+"px").css("left",left+"px").css('position',"absolute");

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
