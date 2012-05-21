 //
//Scripts for messages panel on cases tab
//

//Load new messages on scroll
function addMoreMessages(scrollTarget, view) {

    var scrollAmount = scrollTarget[0].scrollTop;
    var scrollHeight = scrollTarget[0].scrollHeight;

    scrollPercent = (scrollAmount / (scrollHeight - scrollTarget.height())) * 100;

    if (scrollPercent > 70)
    {
        //the start for the query is added to the scrollTarget object
        if (typeof scrollTarget.data('startVal') == "undefined")
        {
            startNum = 20;
            scrollTarget.data('startVal', startNum);
        }
        else
        {
            startNum = scrollTarget.data('startVal') + parseInt(20);
            scrollTarget.data('startVal', startNum);
        }

        if (scrollTarget.data('searchOn') === 'y')  //we are searching
        {
            $.post('lib/php/data/cases_messages_load.php', {'type': view,'start': scrollTarget.data('startVal'),'s': scrollTarget.data('searchTerm')}, function(data) {

                //var t represents number of messages in returned data; if 0,return false;
                var t = $(data).find('div').length;

                if (t === 0)

                {
                    return false;
                }

                else
                {
                    scrollTarget.append(data);
                    layoutMessages();
                    scrollTarget.highlight(scrollTarget.data('searchTerm'));
                }

            });
        }
        else
        {
            $.post('lib/php/data/cases_messages_load.php', {'type': view,'start': scrollTarget.data('startVal')}, function(data) {

                //var t represents number of messages in returned data; if 0,return false;
                var t = $(data).find('div').length;

                if (t === 0)

                {
                    return false;
                }

                else
                {
                    scrollTarget.append(data);
                    layoutMessages();
                }

            });
        }

    }
}

//Checks if a div is overflowing.  See http://stackoverflow.com/a/143889/49359
function checkOverflow(target)
{
    var el = target[0];
    var curOverflow = el.style.overflow;
    if (!curOverflow || curOverflow === "visible")
        el.style.overflow = "hidden";

    var isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;

    el.style.overflow = curOverflow;

    return isOverflowing;
}

function layoutMessages()
{
    //Check to see if the list ofs recipients are overflowing.  If so, add a link to expand
    var oFlow = null;

    $('p.tos').each(function() {

        if (!$(this).next('p').hasClass('msg_to_more'))  //we haven't already fixed overflow
        {
            oFlow = checkOverflow($(this));

            if (oFlow === true)
            {
                $(this).css({'overflowY': 'hidden'});
                $(this).after('<p class="msg_to_more ex_tos"><a href="#">and others</a></p>');
            }
        }
    });


    $('p.ccs').each(function() {
        if (!$(this).next('p').hasClass('msg_to_more'))  //we haven't already fixed overflow
        {
            oFlow = checkOverflow($(this));
            if (oFlow === true)
            {
                $(this).css({'overflowY': 'hidden'});
                $(this).after('<p class="msg_to_more"><a href="#">and others</a></p>');
            }
        }
    });
    //round corners
    $('div.msg').addClass('ui-corner-all');

    //Set opacity of read messages
    $('div.msg_read').css({'opacity': '.5'});
}


//User clicks to open messages window
$('.case_detail_nav #item5').live('click', function() {

    var caseId = $(this).closest('.case_detail_nav').siblings('.case_detail_panel').data('CaseNumber');

    var thisPanel = $(this).closest('.case_detail_nav').siblings('.case_detail_panel');

    var scrollTarget = thisPanel.find('.case_detail_panel_casenotes');

    //Get heights
    var toolsHeight = $(this).outerHeight();
    var thisPanelHeight = $(this).closest('.case_detail_nav').height();
    var documentsWindowHeight = thisPanelHeight - toolsHeight;

    thisPanel.load('lib/php/data/cases_messages_load.php', {'type': 'main','case_id': caseId,'start': '0'}, function() {

        //Set css
        $('div.case_detail_panel_tools').css({'height': toolsHeight});
        $('div.case_detail_panel_casenotes').css({'height': caseNotesWindowHeight});
        $('div.case_detail_panel_tools_left').css({'width': '30%'});
        $('div.case_detail_panel_tools_right').css({'width': '70%'});

        //Set buttons
        $('button.cse_new_msg').button({icons: {primary: "fff-icon-email-go"},text: true});

        //Round Corners
        $('div.msg').addClass('ui-corner-all');

        //We are not searching
        thisPanel.data('searchOn', 'n');

        //Apply shadow on scroll
        $(this).children('.case_detail_panel_casenotes').bind('scroll', function() {
            var scrollAmount = $(this).scrollTop();
            if (scrollAmount === 0 && $(this).hasClass('csenote_shadow'))
            {
                $(this).removeClass('csenote_shadow');
            }
            else
            {
                $(this).addClass('csenote_shadow');
                var view = null;

				if (thisPanel.data('searchOn') === 'y')  //we are searching
				{
					view = 'search';
				}
				else
				{
					view = 'main';
				}

				addMoreMessages($(this), view);
            }
        });

        //Toggle message message open/closed state, retrieve replies
        $('div.msg_bar').live('click', function() {

            var msgParent = $(this).parent();

            if ($(this).parent().hasClass('msg_closed'))
            {
                msgParent.removeClass('msg_closed').addClass('msg_opened');

                msgParent.find('p.tos, p.ccs, p.subj').css({'color': 'black'});

                msgParent.css({'opacity': '1'});

                var thisMsgId = msgParent.attr('data-id');

                //msgParent.data('verticalPos', $('div#msg_panel')[0].scrollTop);

                //turn off auto-refresh
                //clearTimeout(msgRefresh);

                $(this).next('div').find('div.msg_replies').load('lib/php/data/cases_messages_load.php', {'type': 'replies','thread_id': thisMsgId}, function() {
                    //Set the height
                    var newHeight = $(this).closest('div.msg')[0].scrollHeight;
                    msgParent.animate({'height': newHeight});
                    if (thisPanel.data('searchOn') === 'y')
                    {
                        thisPanel.highlight(target.data('searchTerm'));
                    }
                });

                //Mark message as read
                $.post('lib/php/data/messages_process.php', {'action': 'mark_read','id': thisMsgId});

            }
            else
            {
                msgParent.removeClass('msg_opened').addClass('msg_closed');

                msgParent.find('div.msg_reply_text').hide().find('textarea').val('');

                msgParent.find('div.msg_forward').hide();

                msgParent.css({'opacity': '.5'});

                msgParent.animate({'height': '90'});

            //turn auto refresh back on
            //msgRefresh = setInterval("msgLoad()", 90000);
            }

        });

        //Listen for when user stars message
        $('span.star_msg').live('click', function(event) {
            event.stopPropagation();
            var thisId = $(this).closest('div.msg').attr('data-id');

            if ($(this).hasClass('star_off'))
            {
                $(this).removeClass('star_off').addClass('star_on');
                $(this).html('<img src = "html/ico/starred.png">');

                $.post('lib/php/data/messages_process.php', {'action': 'star_on','id': thisId}, function(data) {
                    var serverResponse = $.parseJSON(data);
                    if (serverResponse.error === true)
                    {
                        notify(serverResponse.message, true);
                    }
                });
            }
            else
            {
                $(this).removeClass('star_on').addClass('star_off');
                $(this).html('<img src = "html/ico/not_starred.png">');
                $.post('lib/php/data/messages_process.php', {'action': 'star_off','id': thisId}, function(data) {
                    var serverResponse = $.parseJSON(data);
                    if (serverResponse.error === true)
                    {
                        notify(serverResponse.message, true);
                    }
                });
            }
        });

    });


});
