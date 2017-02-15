//#NOTE: If you want to see a new function/feature, just request it at: https://github.com/kaansoral/adventureland/issues
var character=parent.character;
var G=parent.G; // Game data
var safeties=true;

function activate(num) // activates an item, likely a booster, in the num-th inventory slot
{
	parent.activate(num);
}

function shift(num,name) // shifts an item, likely a booster, in the num-th inventory slot
{
	// shift(0,'xpbooster')
	// shift(0,'luckbooster')
	// shift(0,'goldbooster')
	parent.shift(num,name);
}

function can_use(name) // work in progress, can be used to check cooldowns of class skills [02/02/17]
{
	return parent.can_use(name);
}

function use(name,target) // a multi-purpose use function, works for skills too
{
	if(isNaN(name)) // if name is not an integer, use the skill
	{
		if(!target) target=get_target();
		parent.use_skill(name,target);
	}
	else
	{
		// for example, if there is a potion at the first inventory slot, use(0) would use it
		equip(name);
	}
}

function use_skill(name,target)
{
	if(!target) target=get_target();
	parent.use_skill(name,target);
}

function item_properties(item) // example: item_properties(character.items[0])
{
	if(!item || !item.name) return {};
	return calculate_item_properties(G.items[item.name],item);
}

function item_grade(item) // example: item_grade(character.items[0])
{
	// 0 Normal
	// 1 High
	// 2 Rare
	if(!item || !item.name) return -1;
	return calculate_item_grade(G.items[item.name],item);
}

function item_value(item) // example: item_value(character.items[0])
{
	if(!item || !item.name) return 0;
	return calculate_item_value(item);
}

function get_socket()
{
	return parent.socket;
}

function get_map()
{
	return parent.G.maps[parent.current_map];
}

function set_message(text,color)
{
	if(color) text="<span style='color: "+color+"'>"+text+"</span>";
	$('#gg').html(text);
}

function game_log(message,color)
{
	if(!color) color="#51D2E1";
	parent.add_log(message,color);
}

function get_target_of(entity) // .target is a Name for Monsters and `id` for Players - this function return whatever the entity in question is targeting
{
	if(!entity || !entity.target) return null;
	if(character.id==entity.target) return character;
	for(var id in parent.entities)
	{
		var e=parent.entities[id];
		if(e.id==entity.target) return e;
	}
	return null;
}

function get_target()
{
	return parent.ctarget;
}

function get_targeted_monster()
{
	if(parent.ctarget && !parent.ctarget.dead && parent.ctarget.type=='monster') return parent.ctarget;
	return null;
}

function change_target(target,public)
{
	parent.ctarget=target;
	if(!public) //no need to send the target on default for CODE, some people are using change_target 5-6 times in an interval
	{
		// user change_target(target,true) from now on to send the target to the server explicitly [23/10/16]
		if(target) parent.last_id_sent=target.id;
		else parent.last_id_sent='';
	}
	parent.send_target_logic();
}

function can_move_to(x,y)
{
	if(is_object(x)) y=x.real_y,x=x.real_x;
	return can_move({map:character.map,x:character.real_x,y:character.real_y,going_x:x,going_y:y});
}

function in_attack_range(target) // also works for priests/heal
{
	if(!target) return false;
	if(parent.distance(character,target)<=character.range) return true;
	return false;
}

function can_attack(target) // also works for priests/heal
{
	// is_disabled function checks .rip and .stunned
	if(!target) return false;
	if(!parent.is_disabled(character) && in_attack_range(target) && new Date()>=parent.next_attack) return true;
	return false;
}
function can_heal(t){return can_attack(t);}

function attack(target)
{
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("Nothing to attack()","gray"); return; }
	if(target.type=="character") parent.player_attack.call(target);
	else parent.monster_attack.call(target);
	last_attack=new Date();
}

function heal(target)
{
	if(safeties && mssince(last_attack)<400) return;
	if(!target) { game_log("No one to heal()","gray"); return; }
	parent.player_heal.call(target);
	last_attack=new Date();
}

function buy(name,quantity) //item names can be spotted from show_json(character.items) - they can be bought only if an NPC sells them
{
	parent.buy(name,quantity);
}

function sell(num,quantity) //sell an item from character.items by it's order - 0 to N-1
{
	parent.sell(num,quantity);
}

function equip(num)
{
	parent.socket.emit("equip",{num:num});
}

function trade(num,trade_slot,price) // where trade_slot is 1 to 16 - example, trade(0,4,1000) puts the first item in inventory to the 4th trade slot for 1000 gold [27/10/16]
{
	parent.trade("trade"+trade_slot,num,price);
}

function trade_buy(target,trade_slot) // target needs to be an actual player
{
	parent.trade_buy(trade_slot,target.id,target.slots[trade_slot].rid); // the .rid changes when the item in the slot changes, it prevents swap-based frauds [22/11/16]
}

function upgrade(item_num,scroll_num,offering_num) //number of the item and scroll on the show_json(character.items) array - 0 to N-1
{
	parent.u_item=item_num;
	parent.u_scroll=scroll_num;
	parent.u_offering=offering_num;
	parent.upgrade();
}

function compound(item0,item1,item2,scroll_num,offering_num) // for example -> compound(0,1,2,6) -> 3 items in the first 3 slots, scroll at the 6th spot
{
	parent.c_items=[item0,item1,item2];
	parent.c_last=3;
	parent.c_scroll=scroll_num;
	parent.c_offering=offering_num;
	parent.compound();
}

function exchange(item_num)
{
	parent.e_item=item_num;
	parent.exchange(1);
}

function say(message) // please use responsibly, thank you! :)
{
	parent.say(message,1);
}

function move(x,y)
{
	if(!can_walk(character)) return;
	var map=parent.map,move=parent.calculate_move(parent.M,character.real_x,character.real_y,parseFloat(x)||0,parseFloat(y)||0);
	character.from_x=character.real_x;
	character.from_y=character.real_y;
	character.going_x=move.x;
	character.going_y=move.y;
	character.moving=true;
	parent.calculate_vxy(character);
	// parent.console.log("engaged move "+character.angle);
	parent.socket.emit("move",{x:character.real_x,y:character.real_y,going_x:character.going_x,going_y:character.going_y});
}

function show_json(e) // renders the object as json inside the game
{
	parent.show_json(parent.game_stringify(e,2));
}

function get_player(name) // returns the player by name, if the player is within the vision area
{
	var target=null,entities=parent.entities;
	if(name==character.name) target=character;
	for(i in entities) if(entities[i].type=="character" && entities[i].name==name) target=entities[i];
	return target;
}

function get_nearest_monster(args)
{
	//args:
	// max_att - max attack
	// min_xp - min XP
	// target: Only return monsters that target this "name" or player object
	// no_target: Only pick monsters that don't have any target
	// path_check: Checks if the character can move to the target
	// type: Type of the monsters, for example "goo", can be referenced from `show_json(G.monsters)` [08/02/17]
	var min_d=999999,target=null;

	if(!args) args={};
	if(args && args.target && args.target.name) args.target=args.target.name;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="monster" || current.dead) continue;
		if(args.type && current.mtype!=args.type) continue;
		if(args.min_xp && current.xp<args.min_xp) continue;
		if(args.max_att && current.attack>args.max_att) continue;
		if(args.target && current.target!=args.target) continue;
		if(args.no_target && current.target && current.target!=character.name) continue;
		if(args.path_check && !can_move_to(current)) continue;
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function get_nearest_hostile(args) // mainly as an example [08/02/17]
{
	var min_d=999999,target=null;

	if(!args) args={};
	if(args.friendship===undefined) args.friendship=true;

	for(id in parent.entities)
	{
		var current=parent.entities[id];
		if(current.type!="character" || current.rip || current.invincible) continue;
		if(current.party && character.party==current.party) continue;
		if(args.friendship && in_arr(current.owner,parent.friends)) continue;
		if(args.exclude && in_arr(current.name,args.exclude)) continue; // get_nearest_hostile({exclude:["Wizard"]}); Thanks
		var c_dist=parent.distance(character,current);
		if(c_dist<min_d) min_d=c_dist,target=current;
	}
	return target;
}

function use_hp_or_mp()
{
	if(safeties && mssince(last_potion)<600) return;
	var used=false;
	if(new Date()<parent.next_potion) return;
	if(character.mp/character.max_mp<0.2) use('use_mp'),used=true; 
	else if(character.hp/character.max_hp<0.7) use('use_hp'),used=true;
	else if(character.mp/character.max_mp<0.8) use('use_mp'),used=true;
	else if(character.hp<character.max_hp) use('use_hp'),used=true;
	else if(character.mp<character.max_mp) use('use_mp'),used=true;
	if(used) last_potion=new Date();
}

function loot()
{
	var looted=0;
	if(safeties && mssince(last_loot)<200) return;
	last_loot=new Date();
	for(id in parent.chests)
	{
		var chest=parent.chests[id];
		if(safeties && (chest.items>character.esize || chest.last_loot && mssince(chest.last_loot)<1600)) continue;
		chest.last_loot=last_loot;
		parent.socket.emit("open_chest",{id:id});
		looted++;
		if(looted==2) break;
	}
}

function send_party_invite(name,is_request) // name could be a player object, name, or id
{
	if(is_object(name)) name=name.name;
	parent.socket.emit('party',{event:is_request&&'request'||'invite',name:name});
}

function send_party_request(name)
{
	send_party_invite(name,1);
}

function accept_party_invite(name)
{
	parent.socket.emit('party',{event:'accept',name:name});
}
function accept_party_request(name)
{
	parent.socket.emit('party',{event:'raccept',name:name});
}

function respawn()
{
	parent.socket.emit('respawn');
}

function handle_death()
{
	// When a character dies, character.rip is true, you can override handle_death and manually respawn
	// IDEA: A Resident PVP-Dweller, with an evasive Code + irregular respawning
	// respawn current has a 12 second cooldown, best wait 15 seconds before respawning [24/11/16]
	// setTimeout(respawn,15000);
	// return true;
	// NOTE: Add `if(character.rip) {respawn(); return;}` to your main loop/interval too, just in case
	return -1;
}

function handle_command(command,args) // command's are things like "/party" that are entered through Chat - args is a string
{
	// game_log("Command: /"+command+" Args: "+args);
	// return true;
	return -1;
}

function send_cm(to,data)
{
	// to: Name or Array of Name's
	// data: JSON object
	parent.send_code_message(to,data);
}

function on_cm(name,data)
{
	game_log("Received a code message from: "+name);
}

function on_disappear(entity,data)
{
	// game_log("disappear: "+entity.id+" "+JSON.stringify(data));
}

function on_combined_damage() // When multiple characters stay in the same spot, they receive combined damage, this function gets called whenever a monster deals combined damage
{
	// move(character.real_x+5,character.real_y);
}

function on_party_invite(name) // called by the inviter's name
{
	// accept_party_invite(name)
}

function on_party_request(name) // called by the inviter's name - request = someone requesting to join your existing party
{
	// accept_party_request(name)
}

function on_destroy() // called just before the CODE is destroyed
{
	clear_drawings();
}

function on_draw() // the game calls this function at the best place in each game draw frame, so if you are playing the game at 60fps, this function gets called 60 times per second
{
	
}

function on_game_event(event)
{
	if(event.name=="pinkgoo")
	{
		// start searching for the "Love Goo" of the Valentine's Day event
	}
	if(event.name=="goblin")
	{
		// start searching for the "Sneaky Goblin"
	}
}

var PIXI=parent.PIXI; // for drawing stuff into the game
var drawings=parent.drawings;

//Documentation: https://pixijs.github.io/docs/PIXI.Graphics.html
function draw_line(x,y,x2,y2,size,color)
{
	// keep in mind that drawings could significantly slow redraws, especially if you don't .destroy() them
	if(!color) color=0xF38D00;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.moveTo(x,y);
	e.lineTo(x2,y2);
	e.endFill();
	parent.drawings.push(e); //for the game to keep track of your drawings
	parent.map.addChild(e); //e.destroy() would remove it, if you draw too many things and leave them there, it will likely bring the game to a halt
	return e;
}

// Example: draw_circle(character.real_x,character.real_y,character.range) :) [22/10/16]
function draw_circle(x,y,radius,size,color)
{
	if(!color) color=0x00F33E;
	if(!size) size=1;
	e=new PIXI.Graphics();
	e.lineStyle(size, color);
	e.drawCircle(x,y,radius);
	parent.drawings.push(e);
	parent.map.addChild(e);
	return e;
}

function clear_drawings()
{
	drawings.forEach(function(e){
		try{e.destroy({children:true})}catch(ex){}
	});
	drawings=parent.drawings=[];
}

function load_code(name,onerror) // onerror can be a function that will be executed if load_code fails
{
	if(!onerror) onerror=function(){ game_log("load_code: Failed to load","#E13758"); }
	var xhrObj = new XMLHttpRequest();
	xhrObj.open('GET',"/code.js?name="+encodeURIComponent(name)+"&timestamp="+(new Date().getTime()), false);
	xhrObj.send('');
	var library=document.createElement("script");
	library.type="text/javascript";
	library.text=xhrObj.responseText;
	library.onerror=onerror;
	document.getElementsByTagName("head")[0].appendChild(library);
}

function smart_move(destination,on_done) // despite the name, smart_move isn't very smart or efficient, it's up to the players to implement a better movement method [05/02/17]
{
	if("x" in destination)
	{

	}
	else if("to" in destination)
	{

	}
	else if("spawn" in destination)
	{

	}

}

//safety flags
var last_loot=new Date(0);
var last_attack=new Date(0);
var last_potion=new Date(0);
