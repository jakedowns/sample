var CLOSE_LOT_DELAY = 1500;
var STATUS_RESET = 0;
var STATUS_STARTED = 1;
var STATUS_FINAL_CALL = 2;
var STATUS_LOT_CLOSING = 3;
var STATUS_AUCTION_CLOSED = 4;

var lotToBid = null;
var valueToBid = null;
var nextBidValue = null;
var currentLot = null;
var lastHistoryEntry = -1;
var topBid;
var lastMessage = -1;
var lastBidId = -1;
var auctionState = {
    v: 0,
    ln: "0",
    cb: -1,
    nb: -1
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0
})

 
function SetAutoTick() {
    TickAll();
}

var clearit = 0;
function TickAll() {
    clearit = setTimeout('TickAll()', 1000);
    DoTick();
}

function DoTick() {
	thisBidder.id = $('#thisbidderTB').val()-0;
	thisBidder.isPremium="0";
	auctionSessionId = $('#auctionsessionTB').val();
	AuctionRoom.GetUpdate(auctionSessionId, auctionState.v,  thisBidder.id, lastBidId, auctionState.ln , GotAuctionUpdate);
}
 
function GotAuctionUpdate(res) {
    var json = $.parseJSON(res.value);
	 console.log('json.v '+ json.v+" bid "+json.cb+' hb'+json.hb+" "+json.bh.length+"  bidct "+json.lbidct);
	/*  Display login/register button if user not logged in or registered, respectively  */
	 
	if($('#thisbidderTB').val()=='0')
	{
		 resetButtons();
		 $('#state_logged_out').addClass('show');
	}
	else if($('#streamPaddleNo').html()=="")
	{
		 resetButtons();
		 $('#state_not_registered').addClass('show');
	}
/*
	if ($("#thisbidderTB").val() == "0") {
	  if (!$("#state_logged_out").is(".show")) {
		resetButtons();
		$("#state_logged_out").addClass("show");
	  }
	} else if ($("#streamPaddleNo").html() == "") {
	  if (!$("#state_not_registered").is(".show")) {
		resetButtons();
		$("#state_not_registered").addClass("show");
	  }
	}	
	
	*/
	
    if (json && json.cb-0>0) {
	    var prevLot= $('#spancurrentlot').html();
		$('#spancurrentlot').html(json.ln);    	/* update lot # on screen  */
		if(json.cb-0>0)
		{
		     $('#spanloggedbid').html( formatter.format(json.cb ));
		}
		$('#bidbtnbid').html("Bid "+formatter.format(json.nb ));
		if(json.hb != $('#thisbidderTB').val())
		{
		  if(json.cb -0 >0)
		  {
			if(json.hub)
			{
				if( $('#myBid').val()!='' &&  $('#myBid').val()-0 > json.hb-0)
				{
					console.log('do not set to outbid');
					$('#myBid').val('');
				}
				else
				{
					/* Set OutBid button  */
					resetButtons();
					if(json.lbidct>0)
					{
						$('#state_outbid').addClass('show');
						$('#bidoutbid').attr('value',  'Bid '+(formatter.format(json.nb )));
						$('#state_outbid > div.streaming--slider > p > span:last').html('Bid '+(formatter.format(json.nb )));
					}
					else
					{
						$('#state_waiting').addClass('show');
					}
				}
			}
			else
			{
				/*  Set Bid button  */
				resetButtons();
				if(json.lbidct>0)
				{
					$('#state_logged_in').addClass('show');
					$('#bidbtnloggedin').attr('value',  'Bid '+(formatter.format(json.nb )));
					$("#bidbtnloggedin").prop("disabled",false);
				}
				else
				{
					$('#state_waiting').addClass('show');
				}
			}
		  }
		}
		else
		{
			if(json.cb-0>0)
			{
				resetButtons();
				$('#state_winning').addClass('show');
				$('#bidbtnwinning').attr('value', 'Bidding '+(formatter.format(json.cb )));
			    $('#state_winning > div.streaming--slider > p > span:last').html('Bidding '+json.cb);
			}
		}
		$('#nextbidTB').val(json.nb);
		currentLot = lotHash[json.ln];
        $('#LiveAuctionCurrentLotImage').attr('src', currentLot.image.replace('/200','/1200'));
		$('#estimatespan').html(currentLot.estimate);
		$('#titlespan').html("<strong>"+currentLot.artist+"</strong><br>"+currentLot.title);
		$('#descriptionspan').html(currentLot.description);
	   if(auctionState.v==0)
	   {
			for (var key in lotHash) 
			{
				if(lotHash[key].res!=='')
				{
					var lotref= "#res"+ lotHash[key].lotNumber;
					$(lotref).addClass('visible');				
				}			
			}
	   }

		console.log('compare '+json.v+' '+auctionState.v+ " "+json.ln );
    //    if (json.v != auctionState.v && auctionState.v !=0 ) 
	    if (json.v != auctionState.v   ) 
		{
             applyUpdate(json);
			 if(json.ln!='' && prevLot==' ')
			 {
				  window.selectLot(json.ln)	;
				  console.log("page load call to wright ");
			 }
			 if(prevLot!=json.ln && (json.ln !='' && json.ln !='undefined'  && prevLot !=""))
			 {
				if(prevLot!='' && prevLot!='undefined')
				{
				   prevjQ= '#'+prevLot;
				   $(prevjQ).removeClass('horizontal-waypoint');
				   /*   New Lot   */
				   if( $('#streamPaddleNo').html()!="" && json.ln-0 > prevLot )
				   {
					console.log("Call with new lot");	
					  window.selectLot(json.ln)	;
				      if(json.lbidct==0)
					  {
						resetButtons();
						$('#state_waiting').addClass('show');
					    // window.selectLot(json.ln)	;
					  }
					  else
					  {
						 console.log("trying to wait with live bid");
					  }
				   }
				}				
				$('#'+json.ln).addClass('horizontal-waypoint');				
			 	$('p.upcoming--bid').removeClass('visible');
				$('p.upcoming--result').removeClass('visible');
				if(prevLot!='' && prevLot!='undefined')
				{
					var prevResult = getprevLotResult(prevLot);
					var prevref= "#res"+ prevLot;
					$(prevref).html(prevResult);					 
				}
				
				var currlotfound="";
				var ctr=0;
				for (var key in lotHash) 
				{
				//	if(typeof lotHash[key].lotNumber !== 'undefined' && (lotHash[key].bidlink!='undefined' && lotHash[key].bidlink!=''))
					if(typeof lotHash[key].lotNumber !== 'undefined'	)				
					{
						var linkref= "#lnk"+lotHash[key].lotNumber;
						var resref= "#res"+lotHash[key].lotNumber;
						if(ctr==0)
						{
							$(resref).addClass('visible');
						}
						if(key== json.ln)
						{
							ctr=1;
							$(resref).removeClass('visible');
						}
						else
						if(ctr==2 || ctr==3)
						{
							$(linkref).html('');  // clear links of next two items. This prevents them from being bid on in case of lot recall. 
							$(resref).html('');
						}
						else
						if(ctr>3 && $(linkref).html()!="")
						{
							console.log(linkref);
							$(linkref).addClass('visible');
						}
						ctr = ctr==0? 0: ctr+1;
					}
				}
			  
			     //  BuildCarousel(json.ln);
			 }
        }
	 	console.log(json);
    }
    else 
	{
        if(json)
		{
			if(json.v==0)
			{
				resetButtons();
				$('#state_waiting').addClass('show');
			}
			else 
			if(json.v== $('#waitmessage').val())
			{
				resetButtons();
				$('#state_waiting').addClass('show');
			}
		}
		else
		{
			console.log("error parsing json");
		}
    }
}
function getprevLotResult(pLot)
{
	var cDate= new Date();
	var url="AjaxLibSA.aspx?command=GetLotResult&lot="+pLot+"&sess="+$('#auctionsessionTB').val()+"&id="+cDate.toTimeString();
	html = jQuery.ajax({
		url: url,
		async: false
	}).responseText;		
	 
	console.log("RESULT "+pLot);
	return html;
}

function  appendFakeLots() {
    /* Appends fake lots */
	 var jquery__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(jquery__WEBPACK_IMPORTED_MODULE_1__);
    for (let i = 500; i < 504; i++) {
        let waypoint = i === 114 ? 'id=horizontal-waypoint' : '';
        let itemDiv = '<div data-lot="'+i+'" class="upcoming--item" ${waypoint}>'+
					'<div class="image_wrapper"><img src="./public/images/items/${i}.jpg" class="upcoming--image" /></div>'+
					'<h2 class="upcoming--lotnumber">${i}</h2>'+
					'<p class="upcoming--details">'+
						'<span class="upcoming--details-name">Artist Name Lorem Ipsum</span>'+
						'<span class="upcoming--details-title">Title Lorem Ipsum Sit Amet Dalor<span>'+	
						'<span class="upcoming--details-estimate">$1,000 &ndash; $1,500</span>'+
					'</p>'+
					'<p class="upcoming--result">result: $2,500</p>'+
					'<p class="upcoming--bid">'+
					'<a target="blank"  href="https://www.wright20.com/auctions/2018/09/paul-rand-the-art-of-design/108?bid=true#todo-item-page-link">place bid</a>'+
				    '</p>'+
				'</div>';
	 jquery__WEBPACK_IMPORTED_MODULE_1___default()('.upcoming .carousel').append(itemDiv); 
     //   $('.upcoming .carousel').append(itemDiv)
    }
}


function BuildCarousel(currLot)
{
		carouselrow='';
      //  currLot="101";
		ict=0;
		nct=0;
		bidlink="";
		result="";
		for (var key in lotHash) 
		{
		  console.log("key "+key);
			lotObj = lotHash[key] ;
         }	
}

function IsNumeric(input) {
     return (input-0) == input && input.length>0;
  }
  
  function applyUpdate(newState) {
    updateLot(newState);
    updateBidHistory(newState);
 
    if (newState.s == STATUS_FINAL_CALL) {
	    if( $('#state_waiting').hasClass("show"))
		{
			console.log("attempting to add bid to wait");
		}
		else
        if (newState.hpb) {
            /*  Set current button container to new class and change text to designate pending */
			$('.show').addClass('pending');
			$('.pending > p.streaming--text:first').addClass('shadow');
			$('.pending > p.streaming--text:last').removeClass('shadow');
			$('.pending > div.streaming--slider > p > span:first').addClass('shadow');
			$('.pending > div.streaming--slider > p > span:last').html('Bid Submitted for: '+formatter.format(newState.nb));
			$('.pending > :button ').val( 'Bid Submitted for: '+formatter.format(newState.nb));
			$('.pending > :button ').prop('disabled', true);
        } else {
            finalCallCB();
        }
    } else if (newState.s == STATUS_LOT_CLOSING) {
        resetUI();
        setHeaderText('Lot is closing.');
    } else if (newState.s == STATUS_AUCTION_CLOSED) {
        closeAuctionCB(newState.llp);
    }
    auctionState = newState
}
 
function updateLot(newState) {
    if (newState.ln != 0 && newState.ln != auctionState.ln) {
        if (auctionState.ln) {
            var reopen = naturalSorter(newState.ln, auctionState.ln) < 0;
            closeLotCB(auctionState.ln, reopen, newState.llp);
            openLot(lotHash[newState.ln], reopen, newState.hub);
            if (reopen) {
                updateUCLReopen(lotHash[auctionState.ln]);
            }
        } else {
            openLot(lotHash[newState.ln], newState.hub);
        }
    }
    $("#LiveAuctionLotCountOpenLots").html(newState.ol);
    updateBids(newState);
}

function naturalSorter(as, bs) {
    var a, b, a1, b1, i = 0, n, L,
    rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    if (as === bs) return 0;
    a = as.toLowerCase().match(rx);
    b = bs.toLowerCase().match(rx);
    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i],
        b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}
 
function updateUCLReopen(lot) {
    // if there are 10 lots in the UCL then remove the last
	/*
    if ($(".LiveAuctionUCL").exists()) {
        if ($(".LiveAuctionUCL li").length == 10) {
            $(".LiveAutionUCL").last().remove();
        }

        $(GetUCLHTML(lot)).prependTo($("#LiveAuctionUpcomingLots"));
    }
	*/
}
 
function updateUpcomingLot(lot) {
    var elem = $('#UCL-' + lot.id);
    if (elem != null) {
        elem.remove();
    }
 /*
    if ($(".LiveAuctionUCL").exists() && $(".LiveAuctionUCL").last().exists()) {
        var lastLI = $(".LiveAuctionUCL").last();
        var lastLotNumber = $("#" + lastLI.attr("id") + " .LiveAuctionUCLLotNumberData").html();
        var lastFound = false;
        $.each(lotHash, function (key, value) {
            if (lotHash[key] !== undefined) {
                if (lastFound) {
                    $("#LiveAuctionUpcomingLots").append(GetUCLHTML(lotHash[key]));
                    return false;
                }

                if (key == lastLotNumber) {
                    lastFound = true;
                }
            }
        });
    }
	*/
}

function GetUCLHTML(lot) {
    return "<div id='UCL-" + lot.id + "' class='LiveAuctionUCL'>" +
            "<div class='LiveAuctionUCLLotNumber'>" +
                "<span class='LiveAuctionUCLLotNumberLbl'>Lot #</span>" +
                "<span class='LiveAuctionUCLLotNumberData'>" + lot.lotNumber + "</span>" +
                "<span class='LiveAuctionUCLLotNumberDivider'>-</span>" +
            "</div>" +
            "<div class='LiveAuctionUCLTitle'>" + lot.title + "</div>" +
            "<div class='LiveAuctionUCLImgDiv'><a href='" + lot.url + "' target='_blank'><img class='LiveAuctionUCLImg' src='" + lot.image + "' /></a></div>" +
            "<div class='LiveAuctionUCLCurrentBidDiv'><span class='LiveAuctionUCLCurrentBidLbl'>Current Bid: </span><span class='LiveAuctionUCLCurrentBidData'>" + formatCurrency(lot.currentBid) + "</span></div>" +
            "<div class='LiveAuctionUCLNumBidsDiv'>" +
                "<span class='LiveAuctionUCLNumBidsData'>" + lot.numBids + "</span>" +
                "<span class='LiveAuctionUCLNumBidsLbl'> Bids</span>" +
            "</div>" +
            "<div class='LiveAuctionUCLBidBtnDiv'>" +
                (thisBidder.id != -1 ? "<input type='button' value='Bid " + formatCurrency(lot.nextBid) + "' onclick='placeBidUCL(" + lot.id + ", " + lot.nextBid + ");' />" :
                    "<input type='button' value='Login to Bid' onclick='window.location=\"Login.aspx?back=LiveAuction2.aspx?sessionid=" + auctionSessionId + "\"' />") +
            "</div>" +
            (thisBidder.id != -1 && lot.winner == thisBidder.id ? "<div class='LiveAuctionUCLHighBidderDiv'>You are the high bidder</div>" :
                (lot.hb ? "<div class='LiveAuctionUCLOutBidDiv'>You have been outbid</div>" : "")) +
        "</div>"
}

function openLot(lot, reopen, hasUserBid) {
    if (lot != null && (currentLot == null || currentLot.id != lot.id)) {
        if (!reopen) {
            updateUpcomingLot(lot)
        }
        currentLot = lot;

        $('#LiveAuctionLotDescriptionPanelBody').html(lot.description);
        setBidValue(lot.nextBid);
        $('#LiveAuctionBidInfoCurrentBidValue').html(formatCurrency(lot.currentBid));
        $('#LiveAuctionCurrentLotImage').attr('src', lot.image.replace('/200','/1200'));
        $('#LiveAuctionCurrentLotImageLg').attr('href', lot.image.replace("mid", "med"));
        if (currentLot.isPremium == 1) {
            $('#LiveAuctionCurrentLotPremiumImage').attr('src', "/images/PremierLotGFA.gif");
        }
        else {
            $('#LiveAuctionCurrentLotPremiumImage').attr('src', "/images/spacer.gif");
        }

        $('#LiveAuctionCurrentLotHeaderSpan').html("Lot #" + lot.lotNumber);
        $('#LiveAuctionCurrentLotTitle').html(lot.title);
        $('#LiveAuctionCurrentLotEstimate').html(lot.estimate);
        $('#LiveAuctionFinalCallPanelHeader').html('');

        if (canBid()) {
            setHeaderText('Lot #' + lot.lotNumber + ' is open for bidding');

            if (thisBidder.id != -1 && lot.winner == thisBidder.id) {
                $('#LiveAuctionLotInfoPanelHeader').html('You are the high bidder');
                setButtonInfoClass("HighBidder");
                setBidButtonEnabled(false);
            } else if (!hasUserBid) {
                $('#LiveAuctionLotInfoPanelHeader').html('Bid');
                setButtonInfoClass("NoBid");
                setBidButtonEnabled(true);
            } else {
                $('#LiveAuctionLotInfoPanelHeader').html('Bid');
                setButtonInfoClass("PlaceABid");
                setBidButtonEnabled(true);
            }
        } else {
            setHeaderText('This lot is only available to Premier Bidders.  Please wait for the next one.');
            $('#LiveAuctionLotInfoPanelHeader').html('Bids are not allowed');
            $('#LiveAuctionLotInfoPanelHeader').removeClass().addClass("BidsNotAllowed");
            setBidButtonEnabled(false);
        }

        if (reopen) {
            addMessageListItem(formatLotAsHistoryLink(lot) + " has been reopened", "lot_repoened");
        }
    }
}

function resetUI() {
/*
    setBidValue(null);
    setBidButtonEnabled(false);

    $('#LiveAuctionLotDescriptionPanelBody').html('');
    $('#LiveAuctionLotInfoBidHistoryList').html('');
    $('#LiveAuctionCurrentLotTitle').html('');
    $('#LiveAuctionCurrentLotEstimate').html('');
    setBidValue('');
	*/
}

function canBid() {
    if (currentLot.isPremium == 1 && thisBidder.isPremium != 1) {
        return false;
    } else {
        return true;
    }
}

function setBidValue(nextBid) {
    if (nextBid == null) {
     //   $('#LiveAuctionBidInfoAskingBidValue').html('');
     //   $('#LiveAuctionBidInfoPlaceBidBtn').val('');
        nextBidValue = 0;
    } else {
     //   $('#LiveAuctionBidInfoAskingBidValue').html(formatCurrency(nextBid));
     //   $('#LiveAuctionBidInfoPlaceBidBtn').val('Bid ' + formatCurrency(nextBid));
        nextBidValue = nextBid;
    }
}
 

function placeBid(form) {
 	thisBidder.id = $('#thisbidderTB').val()-0;
	thisBidder.isPremium="0";
	valueToBid = $('#nextbidTB').val();
    $('#myBid').val(valueToBid);
    AuctionRoom.PlaceBid(currentLot.id, valueToBid, thisBidder.id, placeBidCB);
    lotToBid = null;
    valueToBid = null;
    nextBidValue = null;
}

function placeBidCB(res) {
  //  setBidButtonEnabled(true);
    if (res.error == null) {
        var json = $.parseJSON(res.value);
		console.log(json.bidStatus);
        if (json) {
		if (json.bidStatus !== "Bid Accepted") {
			console.log("you are outbid");
		}
		/*
            if (json.bidStatus === "Bid Accepted") {
                $('#LiveAuctionLotInfoPanelHeader').html("You are the high bidder");
                setButtonInfoClass("HighBidder");
            } else {
                $('#LiveAuctionLotInfoPanelHeader').html(json.bidStatus);
                setButtonInfoClass("Outbid");
            }
		*/            
            if (json.lotNumber == currentLot.lotNumber) {
                setBidValue(json.nextBid);
                //$('#LiveAuctionBidInfoCurrentBidValue').html(formatCurrency(json.currentBid));
            }
        }
        else {
            //            alert("Error Parsing JSON Response");
        }
    }
}
 
function placeBidUCL(lotId, amount) {
  //  window.open('VerifyBid.aspx?inventoryid=' + lotId + '&bidamount=' + amount + '&bidtype=S', '_blank');
   console.log('placebiducl');
  }

function placeBidUCLCB(res) {
    if (res.error == null) {
        var json = $.parseJSON(res.value);
    }
}
 
function updateBids(newState) {
    if (newState.ln == auctionState.ln && newState.bh.length < auctionState.bh.length) {
        deleteBidCB(newState);
    }

    if (newState.cb !== -1) {
        $('#LiveAuctionBidInfoCurrentBidValue').html(formatCurrency(newState.cb));
    }

    if (newState.nb !== -1) {
        setBidValue(newState.nb);
    }

    lot = lotHash[newState.ln];
    if (lot != null) {
        lot.currentBid = newState.cb;
        lot.nextBid = newState.nb;
        if (newState.hb != -1) {
            lot.winner = newState.hb;
			/*
            if (!canBid) {
                setBidButtonEnabled(false);
                setButtonInfoClass("NoBid");
            } else if (!newState.hub) {
                setBidButtonEnabled(true);
                setButtonInfoClass("NoBid");
            } else if (lot.winner == thisBidder.id) {
                setBidButtonEnabled(false);
                setButtonInfoClass("HighBidder");
            } else {
                setBidButtonEnabled(true);
                setButtonInfoClass("Outbid");
            }
			*/
        }
    }
}

function finalCall() {
    AuctionRoom.FinalCall(currentLot.id, finalCallCB);
}

function finalCallCB(res) {
/*
    setHeaderText('Final Call for Bids');
    $('#LiveAuctionFinalCallPanelHeader').html('Final Call for Bids');
    $('#LiveAuctionFinalCallPanelHeader').removeClass().addClass("FinalCall");
	*/
}

function closeLot() {
  //  $('LiveAuctionBidInfoAdminCloseLotBtn').attr('disabled', 'disabled');
    AuctionRoom.closeLot(currentLot.id);
}

function closeLotCB(lotNumber, reopen, lastLotPassed) {
    lot = lotHash[lotNumber];
    if (lot != null) {
        if (!reopen) {
            addLotToHistory(lot, lastLotPassed);
        }

        resetUI();
     //   setHeaderText('Lot ' + lotNumber + ' is closing');
        currentLot = null;
        topBid = null;
    }
}

function StartAuction() {
    document.getElementById("LiveAuctionBidInfoAdminStartAuctionBtn").disabled = true;
    AuctionRoom.StartAuction($('#SessionIdHF').val());
}

function setHeaderText(msg) {
  //  $('#LiveAuctionHeaderText').html(msg);
}

function addLotToHistory(lot, lastLotPassed) {
    var message = '';
	var msgClass="ended";
    if (lastLotPassed) {
        message += formatLotAsHistoryLink(lot) + " did not sell";
		msgClass="lot_passed";
	} else if (thisBidder.id != -1 && lot.winner == $('#thisbidderTB').val()) {
        message += 'You Won ' + formatLotAsHistoryLink(lot) + ' for $' + lot.currentBid;
        addMessageListItem(message, "lot_won");
        return;
    } else if (lot.currentBid == 0 || lot.hasLiveBids == 0) {
        if (lot.hasStaticBids) {
            message += formatLotAsHistoryLink(lot) + " sold for $" + lot.currentBid;
			msgClass="lot_sold";
        } else {
            message += formatLotAsHistoryLink(lot) + " did not sell";
			msgClass="lot_passed";
        }
    } else {
        message += formatLotAsHistoryLink(lot) + ' sold for $' + lot.currentBid;
    }

    addMessageListItem(message, msgClass);
}

function formatLotAsHistoryLink(lot) {
	return '<span class="LiveAuctionMessageSpan">Lot #' + lot.lotNumber + '</span>';
}
 

function addMessageListItem(message, cssClass) {
    $('<li class="LiveAuctionMessageListItem ' + cssClass + '">' + message + '</li>').hide().prependTo('#LiveAuctionMessageList').slideDown("slow");
}

/*
function bidButtonOnMouseDown() {
    freezeBid();
}

function freezeBid() {
    lotToBid = currentLot;
    valueToBid = nextBidValue;
}
*/
function updateBidHistory(newState) {
    var messages = newState.m;
    for (var len = messages.length - 1, i = len; i >= 0; i--) {
        var msg = messages[i];
        if (msg && msg.i > lastMessage) {
            addMessageListItem("**Auctioneer: " + msg.m, "message");
			var mymsg = msg.m.toLowerCase();
			if(mymsg.includes("last call"))
			{
				   if( $('#state_winning').hasClass('show') )
				   {
					 var dummy="";
				   }
				   else
				   {
						resetButtons();
						$('#state_lastcall').addClass('show');
						$('#bidlastcall').attr('value', 'Bid '+formatter.format(newState.nb ));
						$('#state_lastcall > div.streaming--slider > p > span:last').html('Bid '+formatter.format(newState.nb));    
				   }
			}
            lastMessage = msg.i;
        }
    }

    var history = newState.bh;
    for (var len = history.length - 1, i = len; i >= 0; i--) {
        var item = history[i];
        if (item && item.i > lastHistoryEntry) {
            addBidToHistory(item.u, item.b, item.i, newState.hub);
            lastHistoryEntry = item.i;
        }
    }
}

function addBidToHistory(bidder, bid, bidId, hasBids) {
    var newItem = '';
	floorBidder = $('#flooruserTB').val();
    if (bidder == thisBidder.id) {
        newItem += '* ';
        $('#LiveAuctionLotInfoPanelHeader').html('You are the high bidder');
    //    setButtonInfoClass("HighBidder");
    //    setBidButtonEnabled(false);
    } else {
        if (hasBids) {
            $('#LiveAuctionLotInfoPanelHeader').html('You have been outbid');
    //        setButtonInfoClass("Outbid");
    //        setBidButtonEnabled(true);
        }
    }

	var msgClass="";
    if (bidder == thisBidder.id) {
        newItem += "You are High Bidder at $";
		msgClass="bid_winning";
    } else if (bidder == floorBidder) {
        newItem += "The Floor bids $";
		msgClass="bid_floor";
    } else {
        newItem += 'Internet Bidder bids $'
		msgClass="bid_internet";
    }

    newItem += bid;
    topBid = new Object();
    topBid.id = bidId;
    topBid.bid = bid;
    topBid.bidder = bidder;

    addMessageListItem(newItem, msgClass);
    currentLot.numBids++;
    currentLot.hasLiveBids = 1;
}
 
function setBidButtonEnabled(enabled) {
/*
    if (enabled) {
        $('#LiveAuctionBidInfoPlaceBidBtn').removeAttr("disabled");
    }
    else {
        $('#LiveAuctionBidInfoPlaceBidBtn').attr('disabled', 'disabled');
    }
*/
}

function closeAuctionCB(lastLotPassed) {
    addLotToHistory(lotHash[auctionState.ln], lastLotPassed);
	/*
    setHeaderText('The auction has closed.  Thank you for your participation');
    resetUI();
    $('#LiveAuctionBidInfoCurrentBidValue').html('');
    $('#LiveAuctionCurrentLotImage').attr('src', '/images/thanks.jpg');
    $('#LiveAuctionCurrentLotTitle').html('The auction has closed.  Thank you for your participation');
    $('#LiveAuctoinCurrentLotEstimate').html('');
    $('#LiveAuctionBidInfoPlaceBidBtn').val('');
	*/
}

function deleteBidCB(newState) {
    if (newState.bh.length == 0) {
        topBid = null;
        currentLot.numBids = 0;
    } else {
        topBid = new Object();
        topBid.id = newState.bh[0].i;
        topBid.bid = newState.bh[0].b;
        topBid.bidder = newState.hb;
        currentLot.numBids--;
      
        if (topBid.bidder == thisBidder.id) {
            // $('#LiveAuctionLotInfoPanelHeader').html('You are the high bidder');
			resetButtons();
			$('#state_winning').addClass('show');
			$('#bidbtnwinning').attr('value', 'You are Bidding '+(formatter.format(newState.nb )));				
        } else if (newState.hub) {
            // $('#LiveAuctionLotInfoPanelHeader').html('You have been outbid');
			resetButtons();
			
			$('#state_outbid').addClass('show');
			$('#bidoutbid').attr('value',  'Bid '+(formatter.format(newState.nb )));
			$('#state_outbid > div.streaming--slider > p > span:last').html('Bid '+newState.nb);
			
			
        } else {
            $('#LiveAuctionLotInfoPanelHeader').html('');
        }
    }
    var str = "** Floor Clerk has deleted a bid ";
    str += ".  Next bid is now $" + newState.nb;
    addMessageListItem(str, "bid_deleted");
}
function formatCurrency(total) {
    return "$" + parseInt(total).toLocaleString();
}

function updateUpcomingLotBids(newState) {
    if (newState.lbid > lastBidId) {
        for (i = 0; i < newState.ub.length; i++) {
            if (typeof lotHash[newState.ub[i].ln] != 'undefined') {
                lotHash[newState.ub[i].ln].currentBid = newState.ub[i].cb;
                lotHash[newState.ub[i].ln].nextBid = newState.ub[i].nb;
                lotHash[newState.ub[i].ln].hasBids = newState.ub[i].hb;
                lotHash[newState.ub[i].ln].winner = newState.ub[i].hbid;
			/*
                if ($("#UCL-" + lotHash[newState.ub[i].ln].id).exists() && thisBidder.id != -1) {
                    $("#UCL-" + lotHash[newState.ub[i].ln].id + " input").val("Bid " + formatCurrency(newState.ub[i].nb))

                    if (lotHash[newState.ub[i].ln].winner == thisBidder.id) {
                        if ($("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLOutBidDiv").exists()) {
                            $("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLOutBidDiv").remove();
                        }

                        if (!$("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLHighBidderDiv").exists()) {
                            $("#UCL-" + lotHash[newState.ub[i].ln].id).append("<div class='LiveAuctionUCLHighBidderDiv'>You are the high bidder</div>");
                        }
                    } else if (lotHash[newState.ub[i].ln].hasBids) {
                        if ($("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLHighBidderDiv").exists()) {
                            $("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLHighBidderDiv").remove();
                        }

                        if (!$("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLOutBidDiv").exists()) {
                            $("#UCL-" + lotHash[newState.ub[i].ln].id).append("<div class='LiveAuctionUCLOutBidDiv'>You have been outbid</div>");
                        }
                    }

                    $("#UCL-" + lotHash[newState.ub[i].ln].id + " .LiveAuctionUCLNumBidsData").html(newState.ub[i].numbids);
                }
				*/
            }
        }

        lastBidId = newState.lbid;
    }
}

function resetButtonsold()
{
	 $('.streaming--bid').removeClass('show');
	 $('.pending > p.streaming--text:first').removeClass('shadow');
	 $('.pending > p.streaming--text:last').addClass('shadow');
	 $('.pending > :button ').prop('disabled', false);
	 $('.pending > div.streaming--slider > p > span:first').removeClass('shadow');
	 $('.streaming--bid').removeClass('pending');
}
function resetButtons()
{
     $('.streaming--bid:not(#state_logged_out):not(#state_not_registered)').removeClass('show');
     $('.pending > p.streaming--text:first').removeClass('shadow');
     $('.pending > p.streaming--text:last').addClass('shadow');
     $('.pending > :button ').prop('disabled', false);
     $('.pending > div.streaming--slider > p > span:first').removeClass('shadow');
     $('.streaming--bid').removeClass('pending');
}

function setButtonInfoClass(newClass) {
/*
    $('#LiveAuctionLotInfoPanelHeader').removeClass().addClass(newClass);
    $('#LiveAuctionBidInfoPlaceBidBtn').removeClass().addClass(newClass);
	*/
}

$.fn.exists = function () {
    return this.length !== 0;
}

 