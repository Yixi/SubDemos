/**
 * Author: liuyixi
 * Date: 13-4-12
 * Time: AM11:05
 * A deom jquery plugin about mouseover tooltip.
 */


;(function($){

    $.fn.extend({
        'ToolTip':function(option){
            return this.each(function(){
                if(!(this && this.tagName==="DIV")) return;

                if(this.controller){
                    this.controller.setOption(option);
                }else{
                    if($.isPlainObject(option))
                        this.controller = new Controller(this,option);
                }
            });
        }
    })

    // Construct Method

    var Controller = function(div,option){
        this.option = $.extend(false,{
            //default options
            "message":"乖女儿",
            "width":200
        },option);

        _setupDiv.apply(this,[div]);
        _setupToolTip.apply(this);
    }

    //Private method;

    var _setupToolTip = function(){
        var that = this;
        this.tooltipView = $("<div class='tooltip'></div>")
            .appendTo(document.body)
            .css("position","absolute")
            .css("width",that.option.width)
            .html(that.option.message)
            .hide();

        var top = this.divView.offset().top + this.divView.outerHeight();
        var left = this.divView.offset().left;
        this.tooltipView.css("top",top-1+'px').css("left",left + "px");
    }



    var _setupDiv = function(div){
        var that = this;
        this.divView = $(div);
        this.divView
            .on('mouseenter',this._enter = function(){
                that.tooltipView.show();
            })
            .on('mouseleave',this._out = function(){
                that.tooltipView.hide();
            });
    }

    //Public method

    Controller.prototype.setOption = function(option){
        if($.isPlainObject(option)){
            this.option = $.extend(false,this.option,option);
        }else if(typeof(option)==="string"){
            switch(option){
                case 'destroy':
                    this.destory();
                    break
            }
        }
    }

    Controller.prototype.destory = function(){
        this.tooltipView.remove();
        this.divView.unbind('mouseenter',this._enter).unbind('mouseleave',this._out);
        delete this.divView.get(0).controller;
    }

})(jQuery);