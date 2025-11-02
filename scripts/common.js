function get_query_variable(variable) {
    let rv = getQueryVariable(variable);
    return rv;
}
function set_query_variable(queryvars,push=false) {
    setQueryVariable(queryvars,push);
}

function getQueryVariable(variable) {
	/*
	
	Given a query variable, returns that variable's value.

	If the variable is undefined, returns undefined

	*/
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable) {
            if(pair.length==2) {
                return pair[1];
            }
            else {
                return true;
            }
        }
    }
	return(undefined); // If the queryvariable didn't exist.
}

function setQueryVariable(queryvars,push=false) {
    /*
    
    Given a dict, adds each value in the dict to the window path.

    If push is set to true, will push it to the history rather than use replaceState
    
    */

    var qv_text = "";

    if(queryvars!==undefined) {
        var qv_ids = Object.keys(queryvars);
        if(qv_ids.length>0) {
            qv_text = "?"+qv_ids[0]+"="+queryvars[qv_ids[0]];
            if(qv_ids.length>1) {
                for(var i=1;i<qv_ids.length;i++) {
                    qv_text = qv_text + "&" + qv_ids[i] + "=" + queryvars[qv_ids[i]];
                }
            }
        }
    }
    if(push==true) {
        window.history.pushState("Object","Title",window.location.pathname+qv_text);
    }
    else {
        window.history.replaceState("Object","Title",window.location.pathname+qv_text);
    }
}

function semirandom(offset,length) {
    /*
    length is the length of the string that should be returned
    offset is where it should start.
    */
    var pi_val = "3141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173637178721468440901224953430146549585371050792279689258923542019956112129021960864034418159813629774771309960518707211349999998372978049951059731732816096318595024459455346908302642522308253344685035261931188171010003137838752886587533208381420617177669147303598253490428755468731159562863882353787593751957781857780532171226806613001927876611195909216420198938095257201065485863278865936153381827968230301952035301852968995773622599413891249721775283479131515574857242454150695950829533116861727855889075098381754637464939319255060400927701671139009848824012858361603563707660104710181942955596198946767837449448255379774726847104047534646208046684259069491293313677028989152104752162056966024058038150193511253382430035587640247496473263914199272604269922796782354781636009341721641219924586315030286182974555706749838505494588586926995690927210797509302955321165344987202755960236480665499119881834797753566369807426542527862551818417574672890977772793800081647060016145249192173217214772350141441973568548161361157352552133475741849468438523323907394143334547762416862518983569485562099219222184272550254256887671790494601653466804988627232791786085784383827967976681454100953883786360950680064225125205117392984896084128488626945604241965285022210661186306744278622039194945047123713786960956364371917287467764657573962413890865832645995813390478027590099465764078951269468398352595709825822620522489407726719478268482601476990902640136394437455305068203496252451749399651431429809190659250937221696461515709858387410597885959772975498930161753928468138268683868942774155991855925245953959431049972524680845987273644695848653836736222626099124608051243884390451244136549762780797715691435997700129616089441694868555848406353422072225828488648158456028506016842739452267467678895252138522549954666727823986456596116354886230577456498035593634568174324112515076069479451096596094025228879710893145669136867228748940560101503308";
    var pi_len = pi_val.length;

    length = parseInt(length);
    offset = parseInt(offset);
    var r_val = "" // value to be returned. Numeric string.
    if((offset+length) <= pi_len) {
        r_val = pi_val.substring(offset,offset+length);
    }
    else {
        if(offset >= pi_len) {
            // So in this case, the offset ITSELF is beyond the length of the request value, so we just loop around.
            var new_o = offset % pi_len;
            r_val = semirandom(new_o,length);
        }
        else {
            // This means that PART of the offset is within bounds.
            var delta_b = (offset+length) % pi_len;
            var part_a = pi_val.substring(offset,pi_len);
            var part_b = pi_val.substring(0,delta_b);
            r_val = part_a + "" + part_b;
        }
    }
    return r_val;
}

function semirandint(offset,a,b) {
    /*

    Returns a semirandom integer between values a and b inclusive

    */
    if(b===undefined) {
        // We were only passed two values, so return an integer between 0 and a, inclusive
        var b = parseInt(a);
        var a = 0;
    }
    var delta = parseInt(b+1)-parseInt(a);
    var rs = parseInt(parseFloat(delta)*parseFloat(semirandom(offset,3))/1000.0);
    return (parseInt(a)+rs);
}

function truncate(a,digits=1) {
    var fl_a = parseFloat(a);
    var exp = 10**digits;
    var rnd_a = parseFloat(parseInt(fl_a * exp))/exp;
    return rnd_a;
}

function unitconvert(val,src,as_string=false) {
    var converted = 0.0;
    var converted_str = "";
    if(src=="mi") {
        converted = parseFloat(val) * 1.6;
        converted_str = truncate(converted,1) + " km";
    }
    else if(src=="km") {
        converted = parseFloat(val)/1.6;
        converted_str = truncate(converted,1) + " mi";
    }
    if(as_string==true) {
        return converted_str;
    }
    else {
        return converted;
    }
}