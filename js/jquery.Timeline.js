/**
 * @license workpad v@VERSION
 * Author: liuyixi
 * Copyright (c) 2013 Diigo
 *
 * the Time line by slide.
 */

(function($){
    /**
     * this is a timeline plugin for diigo my library items.
     *
     * @example
     *      $("div.timeline").TimeLine();
     *
     * @options
     *      date: { JSON | Array }
     *          json: { start:"2000-1-1", end:"today"} | { start:"2011-1-1", end:"2012-1-1"}
     *          Array: [{time:"2013-5-7"},{time:"2013-5-9"} ....]
     *      grouped: {Boolean} default is true. if true the time line will collapse by year.
     *
     */



    $.fn.extend({
        "TimeLine":function(option){
            return this.each(function(){

                if(!(this && this.tagName === "DIV")) return;
                if(this.controller){

                }else{
                    if($.isPlainObject(option) || option == undefined){
                        this.controller = new Controller(this,option);
                    }
                }
            });
        }
    });

    /**
     * The plugin construct
     * @param element
     * @param option
     * @constructor
     */
    var Controller = function(element,option){
        this.option = $.extend(false,{
            date:{start:"2005-1-1",end:"today"},
            grouped:true

        },option);
        this.container = $(element);
        console.log(1);
        _initView.apply(this);
    };

    /**
     * set up the view.
     * @private
     */
    var _initView = function(){
        var that = this;
        this.timelineElement = $("<div class='tl_timeline'></div>")
            .css({
                width:that.container.outerWidth(),
                height:3,
                marginTop:6,
                position:"relative"
            })
            .appendTo(that.container);
        this.slider = $("<div class='tl_slider'></div>")
            .css({
                width:6,
                height:15,
                position:"absolute",
                left:0,
                top:-6
            })
            .appendTo(that.timelineElement);

        _bindAction.apply(this);
    };

    /**
     * bind the timeline UI action
     * @private
     */

    var _bindAction = function(){

    }



})(jQuery);

