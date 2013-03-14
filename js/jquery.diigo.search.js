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
            "width":320,
            "maxHeight":null,
            "itemHeight":null,
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
                        break;
                    case 40: //down
                        _move.apply(that,['down']);
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
    }

    var _setupSuggestionView = function(){
        var that = this;
        this.SuggestionView = $("<div class='diigols'><ul></ul></div> ")
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
            .css('font-size',this.inputView.css('font-size'));



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
            keyword = this.inputView.val(),
            data =[],
            result = [];
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
            this.inputView.val(selected.attr('val'));
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

    }
    Controller.prototype.destory = function(){

    }



})(jQuery);