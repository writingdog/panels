class showMap {
    constructor() {
        this.panels = {};
        this.gw = 48; //48;
        this.gh = 30; //30;
        this.dw = 600.0;
        this.dh = 400.0;
        this.dx = 0; // left offset used for scrolling the map
        this.dy = 0; // top offset used for scrolling the map
        this.o_x;
        this.o_y;
        this.sel_a = false;
        this.sel_b = false;
        this.dots = false;
        this.zoom = 1;
        this.logic; // assignment logic controller.
        this.labels = false; // are labels being adjusted?
        this.face_ids = {}; // array of face_id : label
        this.face_names = {}; // array of label : face_id
        this.interactor;
    }

    createMap() {
        let m = this.gw / this.gh;
        if(m>1.0) {
            // Landscape
            this.dw = $(document).width()-300;
            this.dh = ($(document).width()-300) / m;
        }
        else {
            this.dw = $(document).width()-300;
            this.dh = (($(document).width()-300)*m);
        }
        this.o_x = this.dw / (this.gw+1);
        this.o_y = this.dh / (this.gh+1);
        $("#show_map_container").css({"width":this.dw,"height":this.dh});
        $("#show_map").css({"width":this.dw,"height":this.dh});
        this.addDots();
    }
    dotDraw() {
        if(this.dots===true) {
            this.hideDots();
        }
        else {
            this.showDots();
        }
    }
    addDots() {
        let m = this.gw / this.gh;
        $(".node_parent").remove();
        //$("#show_map").empty();
        for(let x=1;x<=this.gw;x++) {
            for(let y=1;y<=this.gh;y++) {
                let dot_id = x + "_" + y;
                let pdot = $("<div />",{"class":"node_parent","css":{"left":x * this.o_x,"top":y * this.o_y},"attr":{"draggable":"false"}});
                let dot = $("<div />",{"class":"node","id":dot_id+"_dot","attr":{"node_id":dot_id,"draggable":"false"}});
                let ring = $("<div />",{"class":"node_ring","id":dot_id+"_ring","attr":{"node_id":dot_id,"draggable":"false"}});
                if(this.sel_a!==dot_id || this.sel_b!==dot_id) {
                    // If the dot is not CURRENTLY ACTIVE, then hide it.
                    $(ring).hide();
                } 
                let pmap = this;
                $(dot).on("click",{arg1:pmap,arg2:x,arg3:y},function(e){
                    e.data.arg1.activate(e.data.arg2,e.data.arg3);
                });
                $(pdot).append(dot);
                $(pdot).append(ring);
                if(this.dots===false) {
                    $(pdot).hide();
                }
                $("#show_map").append(pdot);
            }
        }
    }
    showDots() {
        this.dots = true;
        $(".normal_key").hide();
        $(".build_key").show();
        $("#add_panels").html("Done modifying");
        $("#rename_panels").show();
        $("#assign_artists").hide();
        $(".node_parent").show();
        $(".panel_selector").show();
        $(".face_selector").hide();
        this.drawPanels();
    }
    hideDots() {
        this.dots = false;
        this.labels = false;
        // Clear selectors from the mouse logic handler
        this.sel_a = false;
        this.sel_b = false;
        this.pan_handler.reset();
        $(".normal_key").show();
        $(".build_key").hide();
        logic.shadeByUse();
        $("#add_panels").html("Modify layout");
        $("#rename_panels").hide();
        if(logic.needs_recalculation===false) {
            $("#assign_artists").show();
        }
        $(".node_parent").hide();
        $(".panel_selector").hide();
    }
    doLabels() {
        if(this.labels===false) {
            this.labels = true;
            this.logic.manual_assignee = "labels";
            $("#rename_panels").html("Done labeling");
            this.logic.shadeByUse();
            $(".panel_selector").hide();
            $(".face_selector").show();
            $("#label_maker").show();
        }
        else {
            console.log("exit labeling");
            this.logic.manual_assignee = false;
            $("#rename_panels").html("Modify labels");
            $("#label_maker").hide();
            $(".panel_selector").show();
            $(".face_selector").hide();
            this.labels = false;
            this.drawPanels();

        }
    }
    makeLabel(face_id) {
        let ps = face_id.split("|")
        let p_id = ps[0]+"|"+ps[1];
        let p_dir = ps[2];
        $("#label_face").html(face_id);
        if(this.panels[p_id].labels.hasOwnProperty(p_dir)) {
            $("#label_entry").val(this.panels[p_id].labels[p_dir]);
        }
        else {
            $("#label_entry").val("");
        }
    }
    applyLabel() {
        let ps = $("#label_face").html().split("|")
        let p_id = ps[0]+"|"+ps[1];
        let p_dir = ps[2];
        let v = $("#label_entry").val();
        let f_id = p_id + "|" + p_dir; // reconstruct face ID, probably same as ps.html();
        this.face_ids[f_id] = v;
        this.face_names[v] = f_id;
        this.panels[p_id].labels[p_dir] = v;
    }
    activate(x,y) {
        if(this.sel_a!==false) {
            // This means *a* node has been selected for A
            if(this.sel_a.x===x && this.sel_a.y===y) {
                // We are now unselecting this node.
                this.sel_a = false;
                $("#"+x+"_"+y+"_ring").hide();
            }
            else {
                // Hopefully node_b should be false.
                this.sel_b = {x:x,y:y};
                console.log(this.sel_a,this.sel_b);
                $("#"+x+"_"+y+"_ring").show();
                // Check to see if panels are horizontal.
                if(this.sel_b.y === this.sel_a.y) {
                    if(Math.abs(this.sel_b.x-this.sel_a.x)===1) {
                        // Simple case. Panels are horizontal and only one dot apart.
                        this.addPanel();
                    }
                    else {
                        let sx = parseInt(this.sel_a.x);
                        let fx = parseInt(this.sel_b.x);
                        let fy = parseInt(this.sel_a.y);
                        if(this.sel_b.x>this.sel_a.x) {
                            for(let i=sx;i<fx;i++) {
                                this.addPanel({x:i,y:fy},{x:i+1,y:fy});
                            }
                        }
                        else {
                            for(let i=sx-1;i>=fx;i--) {
                                this.addPanel({x:i,y:fy},{x:i+1,y:fy});
                            }
                        }
                    }
                    this.logic.setRecalculation(true);
                    this.drawPanels();
                }
                else if(this.sel_b.x === this.sel_a.x) {
                    // Panel is vertical.
                    if(Math.abs(this.sel_b.y-this.sel_a.y)===1) {
                        // Simple case. Panels are vertical and only one dot apart.
                        this.addPanel();
                    }
                    else {
                        let sy = parseInt(this.sel_a.y);
                        let fy = parseInt(this.sel_b.y);
                        let sx = parseInt(this.sel_a.x);
                        if(this.sel_b.y>this.sel_a.y) {
                            // Panel span is vertical, descending.
                            for(let i=sy;i<fy;i++) {
                                this.addPanel({x:sx,y:i},{x:sx,y:i+1});
                            }
                        }
                        else {
                            for(let i=sy;i>fy;i--) {
                                this.addPanel({x:sx,y:i-1},{x:sx,y:i});
                            }
                        }
                    }
                    this.logic.setRecalculation(true);
                    this.drawPanels();
                }
                else {
                    // Panels are not in the same plane.
                    // So just unset the selectors?
                    $("#"+parseInt(this.sel_a.x)+"_"+parseInt(this.sel_a.y)+"_ring").hide();
                    $("#"+parseInt(this.sel_b.x)+"_"+parseInt(this.sel_b.y)+"_ring").hide();
                    this.sel_a = false;
                    this.sel_b = false;
                }
                this.pan_handler.reset();
            }
        }
        else {
            this.sel_a = {x:x,y:y};
            $("#"+x+"_"+y+"_ring").show();
        }
    }
    addPanel(r_a=false,r_b=false,r_u=false,r_l=false) {
        /*

        This creates a panel object and adds it to the map. The panel can be horizontal or vertical. The start and end coordinates MUST be either in the same horizontal or vertical plane.

        A panel ID is ALWAYS identified with the top-left coordinate first. This will be true EVEN IF THE START AND END ARE PROVIDED IN REVERSE ORDER. So a panel defined with its start and end as:

        Point A: {x:5,y:6}
        Point B: {x:6,y:6}
        = "5_6|6_6", but also

        Point A: {x:6,y:6}
        Point B: {x:5,y:6}
        = "5_6|6_6"

        For vertical panels:

        Point A: {x:3,y:4}
        Point B: {x:3,y:5}
        = "3_4|3_5", but also

        Point A: {x:3,y:5}
        Point B: {x:3,y:4}
        = "3_4|3_5"
        
        If it is prepopulated with a start and end coordinate (r_a, r_b) it will use those. If not, it will take the sel_a and sel_b properties of the map object (which are the ones that have been selected by the user).

        Panels can be single or double-sided. The key is as follows:

        n: Panel allows art on neither side.
        b: Panel allows art on both sides.
        l,r: Vertical panel allowing art on the "left" or "right" side
        u,d: Horizontal panel allowing art on the "up" or "down" side

        r_l defines an optional "label" component. This is used when the map is being preloaded.

        */
        let plm = {"a":{"h":"u","v":"l"},"b":{"h":"d","v":"r"}};
        let a = r_a!==false ? r_a : this.sel_a;
        let b = r_b!==false ? r_b : this.sel_b;
        let u = r_u!==false ? r_u : "b"; // Without any other context, create this as a both-sided panel.
        let l = {};
        let c;
        let p_m = this;
        let panel,panel_selector,panel_usage,p_id,face_selector_a,face_selector_b;
        if(a.x===b.x) {
            // Same x coordinate, so this must be a vertical panel
            c = "v";
            let p_a,p_b;
            l = r_l!==false ? r_l : {"l":"","r":""};
            if(a.y < b.y) {
                // a is further up than b.
                p_a = a;
                p_b = b;
            }
            else {
                p_a = b;
                p_b = a;
            }
            p_id = p_a.x + "_" + p_a.y + "|" + p_b.x + "_" + p_b.y;
            if(this.panels.hasOwnProperty(p_id)===false) {
                let usage_width = (this.o_x / 6.0);
                panel = $("<div />",{"class":"panel","id":p_id,"css":{"width":(this.o_x/16.0),"height":this.o_y},attr:{"draggable":"false"}});
                $(panel).css({"left":(p_a.x * this.o_x)-(this.o_x/32.0),"top":p_a.y * this.o_y});
                panel_selector = $("<div />",{"class":"panel_selector","id":p_id+"_selector","css":{"width":(this.o_x/3.0),"height":(this.o_y*0.8)},attr:{"draggable":"false"}});
                $(panel_selector).css({"left":(p_a.x * this.o_x)-(this.o_x/6.0),"top":(p_a.y * this.o_y)+(this.o_y*0.1)});

                face_selector_a = $("<div />",{"class":"face_selector","id":p_id+"|l_selector","css":{"width":(this.o_x/6.0),"height":(this.o_y*0.8)},attr:{"draggable":"false"}});
                $(face_selector_a).css({"left":(p_a.x * this.o_x)-(this.o_x/6.0),"top":(p_a.y * this.o_y)+(this.o_y*0.1)});
                $(face_selector_a).on("click",{arg1:p_id+"|l"},function(e) { logic.manualAssign(e.data.arg1)});
                

                face_selector_b = $("<div />",{"class":"face_selector","id":p_id+"|r_selector","css":{"width":(this.o_x/6.0),"height":(this.o_y*0.8)},attr:{"draggable":"false"}});
                $(face_selector_b).css({"left":(p_a.x * this.o_x)-(this.o_x*0.0),"top":(p_a.y * this.o_y)+(this.o_y*0.1)});
                $(face_selector_b).on("click",{arg1:p_id+"|r"},function(e) { logic.manualAssign(e.data.arg1)});

                $(panel_selector).on("click",{arg1:p_m,arg2:p_id},function(e){ e.data.arg1.changePanel(e.data.arg2)});
                panel_usage = $("<div />",{"class":"panel_usage","id":p_id+"_usage","css":{"width":(this.o_x/16.0),"height":this.o_y},attr:{"draggable":"false"}});
                $(panel_usage).css({"left":(p_a.x * this.o_x)-(this.o_x/32.0)-(usage_width-(this.o_y/64.0)),"top":p_a.y * this.o_y});
                //$(panel_usage).css({"left":(p_a.x * this.o_x)-(this.o_x/24.0+3.0),"top":p_a.y * this.o_y});
                $(panel_usage).css({"border-left-width":usage_width,"border-left-style":"solid","border-left-color":"var(--unused-border)"});
                $(panel_usage).css({"border-right-width":usage_width,"border-right-style":"solid","border-right-color":"var(--unused-border)"});
            }
        }
        else {
            if(a.y===b.y) {
                c = "h";
                let p_a,p_b;
                l = r_l!==false ? r_l : {"u":"","d":""};
                if(a.x < b.x) {
                    // a is further left than b.
                    p_a = a;
                    p_b = b;
                }
                else {
                    // b is further left than a, so we need to flip the point order.
                    p_a = b;
                    p_b = a;
                }
                p_id = p_a.x + "_" + p_a.y + "|" + p_b.x + "_" + p_b.y;
                if(this.panels.hasOwnProperty(p_id)===false) {
                    let usage_width = (this.o_y / 6.0);
                    panel = $("<div />",{"class":"panel","id":p_id,"css":{"width":this.o_x,"height":(this.o_y/16.0)}});
                    $(panel).css({"left":p_a.x * this.o_x,"top":(p_a.y * this.o_y)-(this.o_y/32.0)});
                    panel_selector = $("<div />",{"class":"panel_selector","id":p_id+"_selector","css":{"width":(this.o_x*0.8),"height":(this.o_y/3.0)}});
                    $(panel_selector).css({"left":(p_a.x * this.o_x)+(this.o_x*0.1),"top":(p_a.y * this.o_y)-(this.o_x/6.0)});

                    face_selector_a = $("<div />",{"class":"face_selector","id":p_id+"|u_selector","css":{"width":(this.o_x*0.8),"height":(this.o_y/6.0)}});
                    $(face_selector_a).css({"left":(p_a.x * this.o_x)+(this.o_x*0.1),"top":(p_a.y * this.o_y)-(this.o_x/6.0)});
                    $(face_selector_a).on("click",{arg1:p_id+"|u"},function(e) { logic.manualAssign(e.data.arg1)});

                    face_selector_b = $("<div />",{"class":"face_selector","id":p_id+"|d_selector","css":{"width":(this.o_x*0.8),"height":(this.o_y/6.0)}});
                    $(face_selector_b).css({"left":(p_a.x * this.o_x)+(this.o_x*0.1),"top":(p_a.y * this.o_y)-(this.o_x*0.0)});
                    $(face_selector_b).on("click",{arg1:p_id+"|d"},function(e) { logic.manualAssign(e.data.arg1)});

                    $(panel_selector).on("click",{arg1:p_m,arg2:p_id},function(e){ e.data.arg1.changePanel(e.data.arg2)});
                    panel_usage = $("<div />",{"class":"panel_usage","id":p_id+"_usage","css":{"width":this.o_x,"height":(this.o_y/16.0)}});
                    $(panel_usage).css({"left":p_a.x * this.o_x,"top":(p_a.y * this.o_y)-(this.o_y/32.0)-(usage_width-this.o_y/64.0)});
                    $(panel_usage).css({"border-top-width":usage_width,"border-top-style":"solid","border-top-color":"var(--unused-border)"});
                    $(panel_usage).css({"border-bottom-width":usage_width,"border-bottom-style":"solid","border-bottom-color":"var(--unused-border)"});
                }
            }
        }
        if(this.dots===false) {
            // The panel selector is used to change the side of the panel.
            // So if we are not in map-modifying mode (i.e. the dots are not visible) then hide this selector.
            $(panel_selector).hide();
        }
        // Also, hide the face selectors that will be used to manually assign artists.
        $(face_selector_a).hide();
        $(face_selector_b).hide();
        if(this.panels.hasOwnProperty(p_id)) {
            // Panel exists. So instead of adding it, delete it.
            $(this.panels[p_id].obj).remove();
            $(this.panels[p_id].use_obj).remove();
            $(this.panels[p_id].selector_obj).remove();
            $(this.panels[p_id].face_selector_a_obj).remove();
            $(this.panels[p_id].face_selector_b_obj).remove();

            // This should have been plm["a"][c] and plm["b"][c] (i.e. the direction marker (c) of point A and point B, but was instead plm[c]["a"] which did not exist.)

            let pla = this.panels[p_id].labels.hasOwnProperty(plm["a"][c]) ? this.panels[p_id].labels[plm["a"][c]] : "";
            let plb = this.panels[p_id].labels.hasOwnProperty(plm["b"][c]) ? this.panels[p_id].labels[plm["b"][c]] : "";
            
            if(pla!=="") {
                delete this.face_id[pla];
                delete this.face_names[p_id+"|"+plm["a"][c]];
            }
            if(plb!=="") {
                delete this.face_id[plb];
                delete this.face_names[p_id+"|"+plm["b"][c]];
            }
            delete this.panels[p_id];
        }
        else {
            this.panels[p_id] = {t:c,u:u,obj:panel,use_obj:panel_usage,selector_obj:panel_selector,face_selector_a_obj:face_selector_a,face_selector_b_obj:face_selector_b,labels:l};
            this.logic.created_sections.add(p_id);
            let ld = ["l","r","u","d"];
            for(let k in ld) {
                let ls = l.hasOwnProperty(ld[k]) ? l[ld[k]] : "";
                if(ls.length>0) {
                    // This implies that a label exists for this panel face.
                    this.face_ids[p_id+"|"+ld[k]] = ls;
                    this.face_names[ls] = p_id + "|" + ld[k];
                }
            }
            $("#show_map").append(this.panels[p_id].obj);
            $("#show_map").append(this.panels[p_id].use_obj);
            $("#show_map").append(this.panels[p_id].selector_obj);
            $("#show_map").append(this.panels[p_id].face_selector_a_obj);
            $("#show_map").append(this.panels[p_id].face_selector_b_obj);
        }
        $("#"+a.x+"_"+a.y+"_ring").hide();
        $("#"+b.x+"_"+b.y+"_ring").hide();
        this.sel_a = false;
        this.sel_b = false;
    }
    drawPanels() {
        for(let k in this.panels) {
            //console.log(k);
            let p = this.panels[k];
            let panel_usage = p.use_obj;
            if(p.t==="h") {
                // Horizontal panel.
                if(p.u==="n") {
                    // No borders should be declared here.
                    $(panel_usage).css({"border-top-color":"var(--unused-border)"});
                    $(panel_usage).css({"border-bottom-color":"var(--unused-border)"});
                }
                else {
                    if(p.u==="u") {
                        $(panel_usage).css({"border-top-color":"var(--available-border)"});
                        $(panel_usage).css({"border-bottom-color":"var(--unused-border)"});
                    }
                    if(p.u==="d") {
                        $(panel_usage).css({"border-top-color":"var(--unused-border)"});
                        $(panel_usage).css({"border-bottom-color":"var(--available-border)"});
                    }
                    if(p.u==="b") {
                        $(panel_usage).css({"border-top-color":"var(--available-border)"});
                        $(panel_usage).css({"border-bottom-color":"var(--available-border)"});
                    }
                }
            }
            else if(p.t==="v") {
                // Vertical panel.
                if(p.u==="n") {
                    // No borders should be declared here.
                    $(panel_usage).css({"border-right-color":"var(--unused-border)"});
                    $(panel_usage).css({"border-left-color":"var(--unused-border)"});
                }
                else {
                    if(p.u==="l") {
                        $(panel_usage).css({"border-left-color":"var(--available-border)"});
                        $(panel_usage).css({"border-right-color":"var(--unused-border)"});
                    }
                    if(p.u==="r") {
                        $(panel_usage).css({"border-left-color":"var(--unused-border)"});
                        $(panel_usage).css({"border-right-color":"var(--available-border)"});
                    }
                    if(p.u==="b") {
                        $(panel_usage).css({"border-left-color":"var(--available-border)"});
                        $(panel_usage).css({"border-right-color":"var(--available-border)"});
                    }
                }
            }
            
        }
    }
    changePanel(id) {
        // Changes the panel usage type.
        this.logic.setRecalculation(true);
        let next = {
            "h":{"n":"u","u":"d","d":"b","b":"n"},
            "v":{"n":"l","l":"r","r":"b","b":"n"}
        }
        if(this.panels.hasOwnProperty(id)) {
            let p = this.panels[id];
            p.u = next[p.t][p.u+""]; // Change the usage type to the next in the sequence.
        }
        this.drawPanels();
    }

    shiftMap() {

    }
}

class panelLogic {
    constructor() {
        this.map;
        this.sections = {};
        this.free_sections = {};
        this.created_sections = new Set();
        this.longest = {};
        this.panels = new Set();
        this.manual = new Set();
        this.faces = {};
        this.needs_recalculation = true;
        this.assignees = [];
        /*
            ["name_1",4],
            ["name_2",3],
            ["name_3",5],
            ["name_4",4],
            ["name_5",2],
            ["name_6",2],
            ["name_7",2],
            ["name_8",4],
            ["name_9",3],
            ["name_10",3],
            ["name_11",1],
            ["name_12",1],
            ["name_13",1],
            ["name_14",1],
            ["name_15",2],
            ["name_16",3],
            ["name_17",2],
            ["name_18",4],
            ["name_19",3],
            ["name_20",3],
            ["name_21",1],
            ["name_22",6],
            ["name_23",4],
            ["name_24",2],
            ["name_25",1],
            ["name_26",1],
            ["name_27",2],
            ["name_28",4],
            ["name_29",3],
            ["name_30",5],
            ["name_31",4],
            ["name_32",2],
            ["name_33",2],
            ["name_34",2],
            ["name_35",4],
            ["name_36",3],
            ["name_37",3],
            ["name_38",1],
            ["name_39",1],
            ["name_40",1],
            ["name_41",1],
            ["name_42",2],
        ];*/
        this.assigned = new Set();
        this.assignments = {};
    }

    artistList() {
        /*

        This ONLY creates the list of artists who need assignment.

        It also adds the click handlers to enter artist-assignment mode.

            */
        $("#assigned_artists").empty();
        $("#unassigned_artists").empty();
        
        let unassigned = [];
        let assigned = [];
        let logic = this;
        for(let k in this.assignments) {
            let artist = this.assignments[k];
            let a_id = k;
            let artist_assigned = artist.panels.size;
            let artist_unassigned = artist.needed - artist_assigned;
            if(artist_assigned>0) {
                if(artist_assigned===1) {
                    assigned.push([k,k + " ("+artist_assigned+" panel)"]);
                }
                else {
                    assigned.push([k,k + " ("+artist_assigned+" panels)"]);
                }
            }
            if(artist_unassigned>0) {
                if(artist_unassigned===1) {
                    unassigned.push([k,k + " ("+artist_unassigned+" panel)"]);
                }
                else {
                    unassigned.push([k,k + " ("+artist_unassigned+" panels)"]);
                }
            }
        }
        $("#unassigned_artists").append("Artists needing assignment: ");
        let un_ul = $("<ul />");
        for(let k in unassigned) {
            let u_s = $("<span />",{id:unassigned[k][0]+"_u_key",text:unassigned[k][1]});
            if(this.manual_assignee===k[0]) {
                $(u_s).css({"font-weight":"bold"});
            }
            $(u_s).on("click",{arg1:logic,arg2:unassigned[k][0]},function(e) {
                e.data.arg1.setManualAssignee(e.data.arg2);
            })
            let u_li = $("<li />");
            $(u_li).append(u_s);
            $(un_ul).append(u_li);
        }
        $("#unassigned_artists").append(un_ul);
        $("#assigned_artists").append("Artists assigned: ");
        let a_ul = $("<ul />");
        
        for(let a in assigned) {
            let a_s = $("<span />",{id:assigned[a][0]+"_a_key",text:assigned[a][1]});
            if(this.manual_assignee===a[0]) {
                $(a_s).css({"font-weight":"bold"});
            }
            $(a_s).on("click",{arg1:logic,arg2:assigned[a][0]},function(e) {
                e.data.arg1.setManualAssignee(e.data.arg2);
                //e.data.arg1.shadeByUse(e.data.arg2);
            })
            let a_li = $("<li />");
            $(a_li).append(a_s);
            $(a_ul).append(a_li);
        }
        $("#assigned_artists").append(a_ul);
        //$("#artist_list").append(assigned.join(", "))
    }
    shadeSection(id,type="section") {
        // Type could also be artist or face
        let rm = {
            "l":"border-left-color",
            "r":"border-right-color",
            "u":"border-top-color",
            "d":"border-bottom-color"
        }
        if(type==="section") {
            for(let s in this.sections) {
                for(let k of this.sections[s]) {
                    let ps = k.split("|");
                    let p_id = ps[0]+"|"+ps[1];
                    let rmid = ""+rm[ps[2]];
                    //console.log(p_id,rmid);
                    let kv = $(this.map.panels[p_id].use_obj);
                    if(s==id) {
                        $(kv).css(rmid,"var(--section-border)");
                    }
                    else {
                        $(kv).css(rmid,"var(--inner-border-color)");
                    }
                }
            }
            
        }
        else if(type==="face") {
            for(let s in this.faces) {
                let ps = s.split("|");
                let p_id = ps[0]+"|"+ps[1];
                let rmid = ""+rm[ps[2]];
                let kv = $(this.map.panels[p_id].use_obj);
                if(s===id) {
                    $(kv).css(rmid,"var(--section-border)");
                }
                else {
                    $(kv).css(rmid,"var(--inner-border-color)");
                }
            }
        }
        else {
            let pm = this.map;
            let ks = this.assignments[id]["panels"]; // This is a set of objects.
            ks.forEach((p) => {
                let ps = p.split("|");
                let p_id = ps[0]+"|"+ps[1];
                let rmid = ""+rm[ps[2]];
                let kv = $(pm.panels[p_id].use_obj);
                $(kv).css(rmid,"var(--selected-border)");
            })
        }
        
    }
    shadeByUse(artist_id=false) {
        let rm = {
            "l":"border-left-color",
            "r":"border-right-color",
            "u":"border-top-color",
            "d":"border-bottom-color"
        }
        if(artist_id!==false) {
            // Manually shade the artist name in the key.
            $("#"+artist_id+"_a_key").css({"font-weight":"bold"});
            $("#"+artist_id+"_u_key").css({"font-weight":"bold"});
        }
        let pm = this.map;
        for(let k in this.assignments) {
            let ks = this.assignments[k]["panels"]; // This is a set of objects.
            ks.forEach((p) => {
                let ps = p.split("|");
                let p_id = ps[0]+"|"+ps[1];
                let rmid = ""+rm[ps[2]];
                if(pm.panels.hasOwnProperty(p_id)){
                    let kv = $(pm.panels[p_id].use_obj);
                    if(k===artist_id) {
                        $(kv).css(rmid,"var(--selected-artist)");
                        $("#"+k+"_a_key").css({"font-weight":"bold"});
                        $("#"+k+"_u_key").css({"font-weight":"bold"});
                    }
                    else {
                        $(kv).css(rmid,"var(--selected-border)");
                        $("#"+k+"_a_key").css({"font-weight":"normal"});
                        $("#"+k+"_u_key").css({"font-weight":"normal"});
                    }
                }
                
            })
        };
        for(let k in this.free_sections) {
            let ks = this.free_sections[k];
            ks.forEach((p) => {
                let ps = p.split("|");
                let p_id = ps[0]+"|"+ps[1];
                let rmid = ""+rm[ps[2]];
                if(pm.panels.hasOwnProperty(p_id)) {
                    let kv = $(pm.panels[p_id].use_obj);
                    $(kv).css(rmid,"var(--inner-border-color)");
                }
            });
        }
        for(let p_id of this.created_sections) {
            if(pm.panels.hasOwnProperty(p_id)) {
                let kv = $(pm.panels[p_id].use_obj);
                let rmid = pm.panels[p_id].u;
                if(rmid==="b") {
                    if(pm.panels[p_id].t==="v") {
                        // Vertical, so "b" means both left and right
                        $(kv).css("border-left-color","var(--created-border)");
                        $(kv).css("border-right-color","var(--created-border)");
                    }
                    else {
                        $(kv).css("border-top-color","var(--created-border)");
                        $(kv).css("border-bottom-color","var(--created-border)");
                    }
                }
                else {
                    rmid = rm[rmid];
                    $(kv).css(rmid,"var(--created-border)");
                }
            }
        }
    }
    resetPanels() {
        this.panels = new Set();
        this.sections = {};
    }
    assignAll() {
        this.assignees = this.assignees.sort((a,b) => { return a[1] < b[1];});
        for(let k of this.assignees) {
            if(this.assignments.hasOwnProperty(k[0])) {
                if(this.assignments[k[0]].manual===false) {
                    this.assignments[k[0]]["panels"] = new Set();
                }
            }
            else {
                this.assignments[k[0]] = {"needed":k[1],"panels":new Set(),"manual":false};
            }
        }
        this.free_sections = structuredClone(this.sections);
        let linear_space_required = 0;
        let linear_space_available = 0;
        for(let k of this.assignees) {
            linear_space_required += k[1];
        }
        for(let k in this.free_sections) {
            linear_space_available += this.sections[k].size;
        }
        console.log(linear_space_required,linear_space_available);
        for(let k in this.assignments) {
            let needed = this.assignments[k].needed - this.assignments[k].panels.size; // It's possible that there is already some necessary.
            let t = this.assign(needed,this.assignments[k].wide);
            if(t!==false) {
                // Check to see if there are already some assignments.
                if(this.assignments[k].panels.size>0) {
                    t.forEach((p) => {
                        this.assignments[k]["panels"].add(p);
                    })
                }
                else {
                    this.assignments[k]["panels"] = t;
                }
            }
        }
        this.artistList();
        this.shadeByUse();
    }

    assign(count,wide=false) {
        // Let's try to assign this.
        let artist_assignment = new Set();
        /*
        Test—try to find the biggest first?
        */
        let freesize = [];
        let exact = false;
        for(let k in this.free_sections) {
            if(this.free_sections[k].size>0 && exact === false) {
                if(this.free_sections[k].size==count) {
                    // Let's try to fill the first available one of EXACTLY the right size.

                    // Check to see if we need this to be be wide.
                    if(wide!==false) {
                        if(logic.checkMaxLinear(this.free_sections[k])>=parseInt(wide)) {
                            // So this fits a wide description.
                            exact = k;
                        }
                    }
                }
                freesize.push({key:k,size:this.free_sections[k].size});
            }
        }
        if(exact!==false) {
            let s = this.free_sections[exact];
            s.forEach((panel) => {
                if(artist_assignment.size<count) {
                    artist_assignment.add(panel);
                    s.delete(panel);
                }
            });
        }
        else {
            // No exact match, sort through to find the one with the most free space afterwards.
            freesize = freesize.sort((a,b) => { return a.size > b.size;});
            for(let k_f in freesize) {
                let k = freesize[k_f].key;
                if(this.free_sections[k].size<count) {
                    //console.log("This section is too small: "+k);
                }
                else {
                    //Test: Try to find the FIRST available slot.
                    if(wide===false) {
                        // If we don't have to check for width, then the assignment process is easy.
                        while(artist_assignment.size<count) {
                            let s = this.free_sections[k];
                            s.forEach((panel) => {
                                if(artist_assignment.size<count) {
                                    artist_assignment.add(panel);
                                    s.delete(panel);
                                }
                            });
                        }
                    }
                    else {
                        // we need to find a wide space within a block of panels.
                        if(artist_assignment.size<count) {
                            // Still have panels to assign.
                            let s = this.free_sections[k];
                            let sz = s.size; // This is the size of the set.
                            let o = 0; // Offset within set.
                            let match = false;
                            let opts = {};
                            //console.log(s,count);
                            s.forEach((p) => {
                                if(o<(sz-count)) {
                                    if(opts.hasOwnProperty(o)) { 
                                        opts[o].add(p);
                                    }
                                    else { 
                                        opts[o] = new Set([p])
                                    }
                                }
                                for(let k in opts) {
                                    if(opts[k].size<count) {
                                        opts[k].add(p);
                                    }
                                }
                                o++;
                            });
                            //console.log(opts);
                            // Naive initial implementation.
                            // We will just take the FIRST block that is valid.

                            for(let k in opts) {
                                if(match===false) {
                                    //console.log(opts[k],this.checkMaxLinear(opts[k]));
                                    if(this.checkMaxLinear(opts[k])>=wide) {
                                        //console.log("wide match found at offset ",k);
                                        // This means this BLOCK is acceptable.
                                        match = true;
                                        let set_left = new Set();
                                        let set_right = new Set();
                                        let set_off = 0;
                                        s.forEach((p) => {
                                            if(opts[k].has(p)) {
                                                // So this is one of the panels we want to assign.
                                                artist_assignment.add(p);
                                                s.delete(p);
                                            }
                                            else {
                                                if(set_off<=parseInt(k)) {
                                                    // This ID within the set is less than the offset.
                                                    // Which means we are in a part of the set BEFORE the offset.
                                                    set_left.add(p);
                                                    s.delete(p);
                                                }
                                                else {
                                                    set_right.add(p);
                                                    s.delete(p);
                                                }
                                            }
                                        });
                                        let cf = Object.keys(this.free_sections).length;
                                        this.free_sections[cf] = set_left;
                                        this.free_sections[cf+1] = set_right;
                                    }
                                }
                            }
                        }
                    }
                    
                }
            }
        }
        
        if(artist_assignment.size!=0) {
            return artist_assignment;
        }
        else {
            // This implies there was a problem in assigning the artist.
            return false;
        }
    }

    assign_old(count) {
        // Let's try to assign this.
        let artist_assignment = new Set();
        /*
        Test—try to find the biggest first?
        */
        let freesize = [];
        for(let k in this.free_sections) {
            if(this.free_sections[k].size>0) {
                freesize.push({key:k,size:this.free_sections[k].size});
            }
        }
        freesize = freesize.sort((a,b) => { return a.size > b.size;});
        for(let k in this.free_sections) {
            if(this.free_sections[k].size<count) {
                //console.log("This section is too small: "+k);
            }
            else {
                //Test: Try to find the FIRST available slot.
                while(artist_assignment.size<count) {
                    let s = this.free_sections[k];
                    s.forEach((panel) => {
                        
                        if(artist_assignment.size<count) {
                            if(panel=="12_14|13_14|u") {
                                console.log("?")
                            }
                            artist_assignment.add(panel);
                            s.delete(panel);
                        }

                    });
                }
            }
        }
        if(artist_assignment.size!=0) {
            return artist_assignment;
        }
        else {
            // This implies there was a problem in assigning the artist.
            return false;
        }
    }
    manualAssign(face_id) {
        /*
        This will set a special mode that lets us assign panels directly to an artist.
        */
        console.log(face_id);
        if(this.manual_assignee==="labels") {
            this.shadeSection(face_id,"face");
            this.map.makeLabel(face_id);
            return;
        }
        if(this.faces.hasOwnProperty(face_id)) {
            // This implies that it is a valid panel face.
            if(this.assignments[this.manual_assignee].panels.has(face_id)) {
                // This face ID is currently assigned to the artist.
                this.manual.delete(face_id);
                this.assignments[this.manual_assignee].panels.delete(face_id);
                this.free_sections[this.faces[face_id]].add(face_id);
            }
            else {
                // This face ID is not currently assigned to the artist.
                if(this.manual.has(face_id)===false) {
                    // It is also not a face_id that has already been assigned in general.
                    // So now it should be assigned.
                    this.manual.add(face_id);
                    this.assignments[this.manual_assignee].panels.add(face_id);
                    this.free_sections[this.faces[face_id]].delete(face_id);
                }
            }
            if(this.assignments[this.manual_assignee].panels.size>0) {
                this.assignments[this.manual_assignee].manual = true;
                if(this.assignments[this.manual_assignee].panels.size === this.assignments[this.manual_assignee].needed) {
                    $("#assign_single_artist").html("Finish assigning");
                }
                else {
                    $("#assign_single_artist").html("Assigning artist: "+this.manual_assignee);
                }
            }
            else {
                this.assignments[this.manual_assignee].manual = false;
                $("#assign_single_artist").html("Assigning artist: "+this.manual_assignee);
            }
            if(this.manual.size>0) {
                this.setRecalculation(true);
            }
            else {
                this.setRecalculation(false);
            }
            this.artistList();
        }
        else {
            console.log("Not a valid face.");
        }
        this.shadeByUse(this.manual_assignee);
    }
    setManualAssignee(artist_id) {
        if(this.manual_assignee===artist_id) {
            // Click to exit assignment.
            this.manual_assignee = false;
            // Unbold everyone in the unassigned list.
            $("#unassigned_artists").children("ul").children("li").each(function() { $(this).children("span").css("font-weight","")});
            $("#assign_single_artist").hide();
            $("#assign_artists").show();
            $(".face_selector").hide();
        }
        else {
            this.manual_assignee = artist_id;
            $("#assign_single_artist").html("Assigning artist: "+this.manual_assignee);
            // Unbold everyone in the unassigned list.
            $("#unassigned_artists").children("ul").children("li").each(function() { $(this).children("span").css("font-weight","")});
            
            $("#assign_single_artist").show();
            $("#assign_artists").hide();
            $(".face_selector").show();
        }
        this.shadeByUse(this.manual_assignee);
    }
    async buildSections() {
        //console.log("rebuilding sections...");
        for(let k of this.assignees) {
            //console.log(k);
            if(this.assignments.hasOwnProperty(k[0])) {
                //console.log("Checking existing "+k[0]);
                if(this.assignments[k[0]].manual===false) {
                    //console.log("Had no existing: "+k[0])
                    // if manual was true then don't automatically remove this from calculation.
                    this.assignments[k[0]].panels = new Set();
                }
            }
            else {
                this.assignments[k[0]] = {"needed":k[1],"panels":new Set(),"manual":false};
            }
            
        }
        this.assigned = new Set();
        this.created_sections = new Set();
        let built = await this.decomposeAll();
        if(built===true) {
            let resolved = await this.resolveLongest();
            if(resolved===true) {
                this.setRecalculation(false);
                console.log("Cloning free sections at buildSections");
                this.free_sections = structuredClone(this.sections); 
                this.artistList();
                this.shadeByUse();
            }
        }
        this.setRecalculation(false);
        $("#assign_artists").show();
        
        return true;
    }
    async decomposeAll() {
        this.longest = {};
        this.sections = {};
        for(let k in this.map.panels) {
            this.decompose(k);
        }
        return true;
    }
    async decompose(p_id,dir) {
        let segment_finish = false;

        let p = this.map.panels[p_id];
        let v = {
            "h":["u","d"],
            "v":["l","r"]
        }
        for(let d of v[p.t]) {
            let ck_id = p_id + "";
            let ck_dir = d;
            if(p.u===d || p.u==="b") {
                // Check to see if we should evaluate these options.
                segment_finish = false;
                if(this.panels.has(ck_id+"|"+d)===false && this.manual.has(ck_id+"|"+d)===false) {
                    let next_id = Object.keys(this.sections).length;
                    this.sections[next_id] = [p_id+"|"+ck_dir];
                    let build_segments = new Set();
                    while(segment_finish===false) {
                        let v = this.checkAdjacency(ck_id,ck_dir);
                        if(v===false) {
                            let adj_id = ck_id+"|"+ck_dir;
                            this.panels.add(adj_id);
                            segment_finish = true;
                        }
                        else {
                            let adj_id = ck_id+"|"+ck_dir;
                            this.panels.add(adj_id);
                            ck_id = v[0]+"";
                            this.sections[next_id].push(v[0]+"|"+v[1]);
                            // Confirm that we've checked this option.
                            ck_dir = v[1]+"";
                        }
                    }
                    for(let k of this.panels) {
                        //console.log(k);
                        if(this.longest.hasOwnProperty(k)) {
                            if(this.sections[next_id].length>this.longest[k][1]) {
                                this.longest[k] = [next_id,this.sections[next_id].length];
                            }
                        }
                        else {
                            this.longest[k] = [next_id,this.sections[next_id].length];
                        }
                    }
                    this.panels = new Set();
                }
            }
        }
        return true;
    }
    async resolveLongest() {
        $("#section_list").empty();
        this.faces = {};
        let new_sections = structuredClone(this.sections);
        //this.sections = {};
        let used_sections = new Set();
        for(let k in this.longest) {
            used_sections.add(this.longest[k][0]);
        }
        this.sections = {};
        for(let k of used_sections) {
            let new_id = Object.keys(this.sections).length;
            this.sections[new_id] = new Set();
            for(let p of new_sections[k]) {
                this.sections[new_id].add(p);
                this.faces[p] = new_id; // Add which section this belongs to.
            }
            let s_select = $("<div />",{"class":"section_selector","text":new_id});
            $(s_select).on("click",{arg1:new_id},function(e) {
                logic.shadeSection(e.data.arg1);
            });
            $("#section_list").append(s_select);
            //this.sections[new_id] = new_sections[k];
        }
        //console.log(used_sections);
        return true;
    }
    checkAdjacency(p_id,face) {
        let p = this.map.panels[p_id];
        /*

        Adjacencies:

        p is a HORIZONTAL panel indexed at x1_y1|x2_y1
            if p has a TOP:
                p could be adjacent to x2_y(1-2)|x2_y1 if x2_y(1-2)|x2_y1 has a LEFT
                else:
                    p could be adjacent to x2_y1|x(2+1)_y1 if x2_y1|x(2+1)_y1 has a TOP
                    else:
                        p could be adjacent to (x1-1)_y1|x1_y1 if (x1-1)_y1|x1_y1 has a TOP
                        else:
                            link TERMINATE
            if p has a BOTTOM:
                p could be adjacent to x2_y1|x2_y(1+1) if x2_y1|x2_y(1+1) has a LEFT
                else:
                    p could be adjacent to x2_y1|x(2+1)_y1 if x2_y1|x(2+1)_y1 has a BOTTOM
                    else:
                        link TERMINATE


        p is a VERTICAL panel indexed at x1_y1|x1_y2
            if p has a LEFT:
                p could be adjacent to (x1-1)_y1|x1_y1 if (x1-1)_y1|x1_y1 has a BOTTOM
        */
        let p_o = p_id.split("|");
        let p_a = {x:parseInt(p_o[0].split("_")[0]),y:parseInt(p_o[0].split("_")[1])};
        let p_b = {x:parseInt(p_o[1].split("_")[0]),y:parseInt(p_o[1].split("_")[1])};
        let valid_adjacency = false;
        let opts = [];
        if(face==="u") {
            // Adjacency check request is for adjacencies to the top face.
            opts.push([p_a.x+"_"+(p_a.y-1)+"|"+p_a.x+"_"+p_a.y,"|r","r"]); // up, right
            opts.push([p_b.x+"_"+(p_b.y-1)+"|"+p_b.x+"_"+p_b.y,"|l","l"]); // up, left
            opts.push([p_b.x+"_"+p_b.y+"|"+(p_b.x+1)+"_"+p_b.y,"|u","u",p_b.x+"_"+(p_b.y-1)+"|"+(p_b.x)+"_"+(p_b.y)]); // level, right
            opts.push([(p_a.x-1)+"_"+p_a.y+"|"+p_a.x+"_"+p_a.y,"|u","u",p_a.x+"_"+(p_a.y-1)+"|"+(p_a.x)+"_"+(p_a.y)]); // level, left
        }
        else if(face==="d") {
            // Adjacency check request is for adjacencies to the bottom face.
            opts.push([p_a.x+"_"+(p_a.y)+"|"+p_a.x+"_"+(p_a.y+1),"|r","r"]); // down, right
            opts.push([p_b.x+"_"+(p_b.y)+"|"+p_b.x+"_"+(p_b.y+1),"|l","l"]); // down, left
            opts.push([p_b.x+"_"+p_b.y+"|"+(p_b.x+1)+"_"+p_b.y,"|d","d",p_b.x+"_"+p_b.y+"|"+(p_b.x)+"_"+(p_b.y+1)]); // level, right
            opts.push([(p_a.x-1)+"_"+p_a.y+"|"+p_a.x+"_"+p_a.y,"|d","d",p_a.x+"_"+p_a.y+"|"+(p_a.x)+"_"+(p_a.y+1)]); // level, left
        }
        else if(face==="l") {
            opts.push([(p_a.x-1)+"_"+p_b.y+"|"+p_a.x+"_"+p_b.y,"|u","u"]); // panel down-left has an upper face
            opts.push([(p_a.x-1)+"_"+p_a.y+"|"+p_a.x+"_"+p_a.y,"|d","d"]); // panel up-left has a lower face
            opts.push([p_a.x+"_"+(p_a.y-1)+"|"+p_a.x+"_"+p_a.y,"|l","l",(p_a.x-1)+"_"+p_a.y+"|"+p_a.x+"_"+p_a.y]); // panel up has a left face
            opts.push([p_a.x+"_"+(p_b.y)+"|"+p_a.x+"_"+(p_b.y+1),"|l","l",(p_b.x-1)+"_"+p_b.y+"|"+p_b.x+"_"+p_b.y]); // panel down has a left face
        }
        else if(face==="r") {
            opts.push([(p_a.x)+"_"+p_b.y+"|"+(p_a.x+1)+"_"+p_b.y,"|u","u"]); // panel down-right has an upper face
            opts.push([(p_a.x)+"_"+p_a.y+"|"+(p_a.x+1)+"_"+p_a.y,"|d","d"]); // panel up-right has a lower face
            opts.push([p_a.x+"_"+(p_a.y-1)+"|"+p_a.x+"_"+p_a.y,"|r","r",(p_a.x)+"_"+p_a.y+"|"+(p_a.x+1)+"_"+p_a.y]); // panel up has a right face
            opts.push([p_a.x+"_"+(p_b.y)+"|"+p_a.x+"_"+(p_b.y+1),"|r","r",(p_b.x)+"_"+p_b.y+"|"+(p_b.x+1)+"_"+p_b.y]); // panel down has a right face
        }
        for(let o of opts) {
            let o_valid = (this.map.panels.hasOwnProperty(o[0]) && this.panels.has(o[0]+o[1])===false) ? true : false;
            if(o_valid===true) {
                // Worth checking the adjacencies of the next value.
                let o_p = this.map.panels[o[0]]; // this is the map panel.
                let cross = false;
                if(o.length===4) {
                    if(this.map.hasOwnProperty(o[3])!==false) { cross =true; }
                }
                if(cross===false) {
                    // There is no possible crossing panel we need to avoid on this level.
                    if(this.map.panels.hasOwnProperty(o[3])===false) {
                        if(o_p.u===o[2] || o_p.u==="b") { // So this is a valid match.
                            if(this.manual.has(o[0]+"|"+o[2])===false) {
                                // This means it is also not a manually blocked node.
                                valid_adjacency = [o[0],o[2]];
                            }
                        }
                    }
                }
            }
        }                   
        return valid_adjacency;
        
    }
    checkMaxLinear(prng) {
        /*
        prng can be a set or an array of panels.
        */
        let pl = [];
        if(Array.isArray(prng)===true) {
            for(let k in prng) {
                pl.push(prng[k]);
            }
        }
        else {
            prng.forEach((p) => { pl.push(p)});
        }
        let last_dir;
        let check_lin = 0;
        let max_lin = 0;
        for(let k in pl) {
            let check_dir = pl[k].split("|")[2];
            //console.log(pl[k],check_dir)
            if(check_dir!==last_dir) {
                // Reset counter
                if(check_lin>=max_lin) {
                    max_lin = parseInt(check_lin);
                }
                last_dir = check_dir;
                check_lin = 1;
            }
            else {
                check_lin++;
                if(check_lin>=max_lin) {
                    max_lin = parseInt(check_lin);
                }
            }
        }
        return max_lin;
    }
    setRecalculation(recalculate=false) {
        this.needs_recalculation = recalculate;
        if(recalculate===false ) {
            // No longer need recalculating. Hide the recalculate marker.
            $("#get_freespace").hide();
        }
        else {
            $("#get_freespace").show();
        }
    }
}

class serialize {
    constructor(args) {
        this.parent = args.hasOwnProperty("parent") ? args.parent : false;
        this.parent_type = args.hasOwnProperty("type") ? args.type : false;
        this.source = {"layout":"#layout_predef","artist":"#artist_predef"};
        this.deserializer = args.hasOwnProperty("deserializer") ? args.deserializer : false;
        if(this.deserializer!==false) {
            $(this.deserializer).on("click",{arg1:this},function(e) {
                e.data.arg1.deserialize();
                if(e.data.arg1.parent_type==="artist") {
                    e.data.arg1.parent.buildSections();
                }
            })
        }
    }

    deserialize(data="self") {
        /*
        Self: Data stored on page.
        */
        let src; // We want this to be some kind of a list or array
        if(data==="self") {
            let src_html = $(this.source[this.parent_type]).val();
            src_html = src_html.replace(/[\n\r,]+/gi,"⬛");
            let src_arr = src_html.split("⬛");
            src = [];
            for(let k in src_arr) {
                //console.log(src_arr[k])
                let kp = this.parse(src_arr[k]);
                if(kp!==false) {
                    src.push(kp);
                }
            }
        }
        this.load(src);
        //console.log(src);
    }

    serialize(data="self",extended=false) {
        let src;
        console.log(data);
        if(data==="self") {
            if(this.parent_type==="artist") {
                $(this.source[this.parent_type]).value = ""; // Delete the load box.
                let ds = [];
                for(let k in this.parent.assignments) {
                    // artist name is k
                    let kd = this.parent.assignments[k];
                    let n = kd.needed; // How many panels does artist need?
                    let a_s = [k,n];
                    if(extended===true) {
                        // If Artist is extended, we want to also include the manual def panels.
                        kd.panels.forEach((p) => {
                            a_s.push(p);
                        });
                    }
                    if(this.parent.assignments[k].wide!==false) {
                        a_s.push("wide|"+this.parent.assignments[k].wide);
                    }
                    ds.push(a_s.join("•"));
                }
                $(this.source[this.parent_type]).val(ds.join("\n"));
            }
        }

    }

    load(src) {
        if(this.parent_type==="artist") {
            // First we need to clear the existing artist list.
            this.parent.assignees = [];
            this.parent.assignments = {};
            for(let k in src) {
                let ks = src[k];
                let as_obj = {0:ks[0],1:ks[1]};
                this.parent.assignees.push(as_obj);
                let p_arr = [];
                let is_wide = false;
                if(ks.length>2) {
                    for(let i=2;i<ks.length;i++) {
                        // Additional panels
                        if(ks[i].substring(0,4)==="wide") {
                            // This is not a panel definition, it's a declaration the artist has art that needs adjacent panels.
                            let ws = ks[i].split("|")
                            as_obj["wide"] = parseInt(ws[1]);
                            is_wide = as_obj["wide"];
                        }
                        else {
                            this.parent.manual.add(ks[i]);
                            p_arr.push(ks[i]);
                        }
                    }
                }
                let manual = p_arr.length>0 ? true : false;
                this.parent.assignments[ks[0]] = {"needed":ks[1],"panels":new Set(p_arr),"manual":manual,"wide":is_wide};
            }
            this.parent.artistList();
        }
    }

    parse(r_i) {
        /*
        Takes a string and returns the parsed element
        */
        let item = r_i.trim();
        let wf = item.length > 0 ? item.substring(0,1) : false;
        if(wf!==false) {
            if(wf==="#") {
                // This is a comment string, in other words.
                // Return false.
                return false;
            }
        }
        else {
            // Empty string, return false.
            return false;
        }
        let item_obj;
        if(this.parent_type==="artist") {
            let w = item.trim();
            if(w.length>0) {
                // Input string has to be longer than 1
                let ws = w.split("•");
                let aname = ws[0].trim();
                let pcount = ws.length >= 2 ? parseInt(ws[1]) : 1;
                item_obj = [aname,pcount]; // Artist name, panel request count or 1 if nothing defined explicitly
                if(ws.length>2) {
                    // Panels were added
                    for(let i=2;i<ws.length;i++) {
                        item_obj.push(ws[i]);
                    }
                }
            }
        }
        return item_obj;
    }
}

class panHandler {
    constructor(args) {
        this.map = args.map;
        this.start = false;
        this.shift = false;
    }
    mouseEvent(e) {
        //console.log(e);
        if(e.originalEvent.button!==0) {
            return;
        }
        let pos = {x:e.originalEvent.clientX,y:e.originalEvent.clientY};
        if(e.type==="mousemove") {
            if(this.shift===true && this.hasOwnProperty("start_node")) {
                this.drag(pos,e);
            }
            else {
                this.move(pos);
            }
        }
        else if(e.type==="mousedown"){
            this.start = pos;
            if(typeof($(e.target).attr("node_id"))!=="undefined") {
                if(this.shift===false) {
                    return;
                }
                this.start_node = $(e.target).attr("node_id");
                let coords = this.start_node.split("_");
                this.map.sel_a = {x:parseInt(coords[0]),y:parseInt(coords[1])};
                $("#"+this.start_node+"_ring").show();
            }
        }
        else if(e.type==="mouseup") {
            if(this.shift===true) {
                // Called when in panel creation time.
                if(this.hasOwnProperty("last_node")) {
                    let end_coords = this.last_node.split("_");
                    this.map.activate(parseInt(end_coords[0]),parseInt(end_coords[1]));
                    delete this.last_node;
                }
                else {
                    this.map.sel_a = false;
                    if(this.hasOwnProperty("start_node")) {
                        delete this.last_node;
                    }
                    $(".node_ring").hide();
                }
            }
            else {
                this.reset();
                // Called when the map is being zoomed or panned
                if(this.start!==false) {
                    let dx = pos.x - this.start.x;// - pos.x;
                    let dy = pos.y - this.start.y;// - pos.y;
                    this.map.dx = this.map.dx + dx;
                    this.map.dy = this.map.dy + dy;
                }
                this.start = false;
            }

        }
    }
    shiftHandler(e) {
        if(e.type==="keydown") {
            this.shift = true;
        }
        else {
            if(this.hasOwnProperty("start_node")) {
                delete this.start_node;
            }
            if(this.hasOwnProperty("last_node")) {
                delete this.last_node;
            }
            $(".node_ring").hide();
            this.shift = false;
        }
    }
    async drag(pos,e) {
        if(this.start!==false && this.map.dots===true) {
            let dx = pos.x - this.start.x;
            let dy = pos.y - this.start.y;
            let delta = Math.sqrt(dx**2 + dy**2);
            if(delta>=10) {
                let compare_dots = await this.findDot(pos,e);
                if(compare_dots===true) {
                    this.compareDot(this.start_node,this.last_node);
                }
            }
        }
    }
    async findDot(pos,e) {
        let match_nodes = new Set();
        let compare = false;
        if(this.hasOwnProperty("start_node")) {
            $("#"+this.start_node+"_ring").show();
        }
        if(typeof($(e.target).attr("node_id"))!=="undefined") {
            this.last_node = $(e.target).attr("node_id");
            $("#"+$(e.target).attr("node_id")+"_ring").show();
        }
        if(this.hasOwnProperty("start_node")) { 
            match_nodes.add(this.start_node);
        }

        if(this.hasOwnProperty("last_node")) {
            match_nodes.add(this.last_node);
            if(this.start_node!==this.last_node) {
                compare = true;
            }
        }
        $(".node_ring").each(function() {
            if(match_nodes.has($(this).attr("node_id"))!==true) {
                $(this).hide();
            }
        });
        if(compare===true) {
            return true;
        }
        else {
            return false;
        }
    }
    async compareDot(a,b) {
        // Check the start and most recent node to see if a valid line can be drawn between them.
        let start_coord = a.split("_");
        let end_coord = b.split("_");
        if(start_coord[0]===end_coord[0]) {
            // Start and end are on the same horizontal plane.
            console.log("vertical");
        }
        else if(start_coord[1]===end_coord[1]) {
            console.log("horizontal");
        }
    }
    move(pos) {
        if(this.start!==false && this.map.zoom>1) {
            // Determine the offsets from the original event.
            let dx = pos.x - this.start.x;// - pos.x;
            let dy = pos.y - this.start.y;// - pos.y;
            $("#show_map").css({"left":this.map.dx+dx,"top":this.map.dy+dy});
        } 
    }
    zoom(dir="out") {
        if(dir===false) {
            // If this is false, we're going to reset the zoom.
            this.map.dx = 0; // Reset the map delta (x) to 0
            this.map.dy = 0; // Reset the map delta (y) to 0
            $("#show_map").css({"transform":"scale(1.0)","left":this.map.dx,"top":this.map.dy});
        }
        if(dir==="out") {
            this.start = false;
            if(this.map.zoom>1) {
                this.map.zoom = this.map.zoom - 1;
            }
        }
        else {
            this.start = false;
            this.map.zoom = this.map.zoom + 1;
            $("#show_map").css({"transform":"scale("+this.map.zoom+")"});
        }
        if(this.map.zoom>1) {
            $("#show_map").css({"transform":"scale("+this.map.zoom+")"});
        }
        else {
            this.map.dx = 0;
            this.map.dy = 0;
            this.map.zoom = 1;
            $("#show_map").css({"transform":"scale(1.0)","left":0,"top":0});
        }
    }
    reset() {
        if(this.hasOwnProperty("start_node")) { delete this.start_node; }
        if(this.hasOwnProperty("last_node")) { delete this.last_node; }
    }
}