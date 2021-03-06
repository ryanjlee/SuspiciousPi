utils={};

utils.toGlossary=function(x){
  //x is an array of objects, and we're turning it into a hash where 
  //the id element from each object is it's key
  var glossary={};
  for (var i=0;i<x.length;i++){
    glossary[x[i].id]=x[i];
  }
  return glossary;
};

utils.parseTimeline = function(allData){
  var timeline = allData.programSteps;
  var lineline = allData.lines;
  var components = allData.components;
  var glossary = utils.toGlossary(components);
  
  for (var i = 0; i < timeline.length; i++){
    //deep clone to avoid altering the glossary
    if (timeline[i].hasOwnProperty('snapshot') && i>0){
      timeline[i-1].component.snapshot=timeline[i].snapshot;
      timeline.splice(i,1);
      lineline.splice(i,1);
      i--;
      continue;
    }
    
    timeline[i].component = {};
    timeline[i].component.timelineIndex = i;
    for (var key in timeline[i]){
      if (key === 'component') continue;
      timeline[i].component[key] = timeline[i][key];
    }
    for (var key in glossary[timeline[i].id]){
      //if (key==='id'){continue;}
      timeline[i].component[key] = glossary[timeline[i].id][key];
    }
    timeline[i].component.value = timeline[i].value;
    if (timeline[i].component.hasOwnProperty('pointer')){
      timeline[i].component.pointsTo = components[timeline[i].component.pointer];
    }
    timeline[i].component.line=lineline[i].line;
    timeline[i].component.time=lineline[i].time;
  }

  return timeline;
};

utils.getPoint = function(x, y, r, theta){
  theta += 90;
  theta = theta * (Math.PI/180);
  var x2 = x + (r*Math.sin(theta));
  var y2 = y + (r*Math.cos(theta));
  var circle = {x1:x, y1:y, r:r, x2:x2, y2:y2};
  return circle;
};

utils.extractScopes=function(allData){
  var scopes = {'-1': 0};
  var scopeX = 500;
  
  var countLevels = function(key, levels) {
    levels = levels || 1;
    var scope = allData.components[key].scope;
    if (scope === 0) {
      return levels;
    }
    levels++;
    return countLevels(scope, levels);
  }

  for (var key in allData.scopes){
    if (key !== '0') {
      level = countLevels(key);
      if (!scopes[level]) {
        scopes[level]=scopeX;
        scopeX+=500;
      }
    }
  }

  return scopes;
};

utils.modal = {};

utils.modal.donut = function(canvas,x,y,obj){
  var c = canvas;
  var cData = obj.object.componentData;
  
  var timesReferenced = 30;
  var arcInterval = 360/timesReferenced;
  transitionTime = 600;


  for (var i = 0; i < timesReferenced; i++){
    var theta1 = i*arcInterval;
    var theta2 = ( (1+i)*arcInterval)-1;
    var anim = new Raphael.animation({opacity:0.2},300,"<>");
    var section = c.path(utils.arcPath(x,y,300,theta1,theta2,30))
      .attr({fill:"#fff",opacity:0})
      .animate(anim.delay( i * (transitionTime/timesReferenced) ));
    section.animate({transform:"r90, " + x + " " + y + ""},1000);
  }
  
};


utils.modal.headline=function(canvas, obj, theatre){
  var c=canvas;
  if (obj.object) {
    obj = obj.object;
  } 
  var cData = obj.componentData;
  
  var text = c.text(-1000, 30, utils.modalizeText(obj))
    .attr({"fill":"#fff","font-size":"40px","text-anchor":"start"})
    .animate({x:10},600,"<>");
  var bbox = text.getBBox();
  var backboard = c.rect(-1000, bbox.y, Math.max(bbox.width + 20, 300), bbox.height)
    .attr({"fill":"#000",opacity:0.8})
    .animate({x:0}, 600, "<>");
  text.toFront();
  text.data("backboard",backboard);
  theatre.headline=text;
};


utils.rippleList=function(canvas,collection,selectedLine,theatre){
  if (selectedLine===undefined){selectedLine=-1;}
  theatre.rippleList = [];
  var x=-40;
  var y=30;
  var anim=new Raphael.animation({x:10,"opacity":1},400,"<>");
  var barAnim=new Raphael.animation({x:0},300,"<>");
  for (var i=0;i<collection.length;i++){
    y+=30;
    var text=canvas.text(x,y+13,(collection[i]) )
      .attr({fill:"#fff","font-size":"20px","text-anchor":"start","opacity":0})
      .animate(anim.delay( 600+(i*50) ));
      
    var bBox=text.getBBox();    
    text.attr({"x":-1*(bBox.width+30)});
  
    var backBoard=canvas.rect((bBox.width+20)*-1,y,bBox.width+20,29)
      .attr({"fill":"#000","opacity":0.8})
      .animate(barAnim.delay( 600+(i*50) ));
      
    text.toFront();
    
    if ( (i+1)===selectedLine){
      text.attr({"fill":"#000","opacity":1});
      backBoard.attr({"fill":"#ff3","width":bBox.width+20});
    }
    
    text.data("backboard",backBoard);
    text.data("lineNumber",i+1);
    theatre.rippleList.push(text);
  }
};


utils.arcPath=function(x,y,r,theta1,theta2,w){
	var f1=0;
	var f2=0;
	var f3=0;
	var f4=1;
	if ((theta2-theta1)>180){
		f1=1;
		f3=1;
		}
	
	var arcPath="";
	arcPath+="M "+utils.getPoint(x,y,r,theta1).x2+" "+utils.getPoint(x,y,r,theta1).y2;
	arcPath+=" A "+r+" "+r+" "+(theta2-theta1)+" "+f1+" "+f2+" "+utils.getPoint(x,y,r,theta2).x2+" "+utils.getPoint(x,y,r,theta2).y2;
	arcPath+=" L "+utils.getPoint(x,y,(r-w),theta2).x2+" "+utils.getPoint(x,y,(r-w),theta2).y2;
	arcPath+=" A "+(r-w)+" "+(r-w)+" "+(theta2-theta1)+" "+f3+" "+f4+" "+utils.getPoint(x,y,(r-w),theta1).x2+" "+utils.getPoint(x,y,(r-w),theta1).y2;
	arcPath+=" Z";
	return arcPath;
};

    
utils.allValues=function(timeline,target){
  var r=[];
  
  for (var i=0;i<timeline.length;i++){
    if (target===timeline[i].id && timeline[i].value!==undefined){
      r.push( JSON.stringify(timeline[i].value) );
    }
  }
  
  return r;
};   
    

// creates text for snapshot of object or array
utils.modalizeText=function(obj){
  var d = "";
  if (obj.componentData.pointsTo !== undefined && obj.componentData.pointsTo.type  && obj.componentData.pointsTo.type === 'object'){
    console.log(obj.componentData);
    d +="" + obj.componentData.name + " = { } ";
  } else if (obj.componentData.pointsTo !== undefined && obj.componentData.pointsTo.type && obj.componentData.pointsTo.type === 'array'){
    console.log(obj.componentData);
    d +="" + obj.componentData.name + " = [ ] ";
  } else if (obj.componentData.hasOwnProperty("type") && obj.componentData.type === 'element'){
    console.log(obj.componentData);
    d +="[" + obj.componentData.name + "] = " + obj.componentData.value + "";
  } else if (obj.componentData.hasOwnProperty('pointsTo') && obj.componentData.pointsTo.type === 'function'){
    d +="function: " + obj.componentData.name + " declaration";
  } else if (obj.componentData.type === 'block' && obj.componentData.name === 'if' && obj.componentData.hasOwnProperty('enter') ){
    d += "if open";
  } else if (obj.componentData.hasOwnProperty('if') && obj.componentData.if === 'close'){
    d += "if close";
  } else if (obj.componentData.hasOwnProperty('if') ){
    d += "if";
  } else if (obj.componentData.hasOwnProperty('invoke') ){
    d +="function: " + obj.componentData.name + " invocation";
  } else if (obj.componentData.hasOwnProperty('return') && obj.componentData.return.hasOwnProperty('value') ) {
    if (obj.componentData.return.value === '___undefined'){
      d += "function: " + obj.componentData.name + " returns undefined";
    } else {
      d += "function: " + obj.componentData.name + " returns " + obj.componentData.return.value + "";
    }
    
  } else if (obj.componentData.for) {
    d +="loop " +obj.componentData.for +"";  
  } else if (obj.componentData.type === 'param'){
    d +="parameter: " +obj.componentData.name +" = " +obj.componentData.value +"";
  } else if (obj.componentData.type && obj.componentData.type === 'var') {
    d +="" +obj.componentData.name +" = " +obj.componentData.value +"";
  } else if (obj.componentData.hasOwnProperty('type') && obj.componentData.type==='property') {
    console.log(obj.componentData);
    d+="{ " + obj.componentData.name + ": " + obj.componentData.value + " }";
  } else {
    console.log(obj.componentData);
  	for (var key in obj.componentData){
  		d +="" +key +": " +obj.componentData[key]+"\n";
  	}
  }
	return d;
};

utils.displayText=function(obj){
  var d="";
  if (obj.componentData.pointsTo!==undefined && obj.componentData.pointsTo.type  && obj.componentData.pointsTo.type==='object'){
    d+="<div>"+obj.componentData.name+" = { } </div>";
  } else if (obj.componentData.pointsTo!==undefined && obj.componentData.pointsTo.type && obj.componentData.pointsTo.type==='array'){
    d+="<div>"+obj.componentData.name+" = [ ] </div>";
  } else if (obj.componentData.hasOwnProperty("type") && obj.componentData.type==='element'){
    d+="<div>["+obj.componentData.name+"] = "+obj.componentData.value+"</div>";
  } else if (obj.componentData.value && obj.componentData.value==='___function code'){
    d+="<div>function: "+obj.componentData.name+" declaration</div>";
  } else if (obj.componentData.type==='block' && obj.componentData.name==='if' && obj.componentData.hasOwnProperty('enter') ){
    d+="<div>if open</div>";
  } else if (obj.componentData.hasOwnProperty('if') && obj.componentData.if==='close'){
    d+="<div>if close</div>";
  } else if (obj.componentData.hasOwnProperty('invoke') ){
    d+="<div>function: "+obj.componentData.name+" invocation</div>";
  } else if (obj.componentData.hasOwnProperty('return') ) {
    d+="<div>function: "+obj.componentData.name+" returns "+obj.componentData.return+"</div>";
  } else if (obj.componentData.for) {
    d+="<div>loop "+obj.componentData.for+"</div>";  
  } else if (obj.componentData.param!==undefined){
    d+="<div>parameter: "+obj.componentData.name+" = "+obj.componentData.param+"</div>";
  } else if (obj.componentData.type && obj.componentData.type==='var') {
    d+="<div>"+obj.componentData.name+" = "+obj.componentData.value+"</div>";
  } else {
  	for (var key in obj.componentData){
  		d+="<div>"+key+": "+obj.componentData[key]+"</div>";
  	}
  }
	return d;
};

utils.tweenify=function(obj,opts){
  //tweenify is a decorator
  if (obj===undefined){var obj={};}
  if (opts===undefined){var opts={};}
  if (opts.x1===undefined){opts.x1=0;}
  if (opts.x2===undefined){opts.x2=0;}
  if (opts.z1===undefined){opts.z1=0;}
  if (opts.z2===undefined){opts.z2=0;}
  
  var easingType="Quintic";
  var tweenDuration=600;

  var xExpand   = new TWEEN.Tween(obj.position).to({x:opts.x2},tweenDuration).easing(TWEEN.Easing[easingType].Out);
  var zCollapse = new TWEEN.Tween(obj.position).to({z:opts.z1},tweenDuration).easing(TWEEN.Easing[easingType].Out);

  obj.collapse  = new TWEEN.Tween(obj.position).to({x:opts.x1},tweenDuration).chain(zCollapse).easing(TWEEN.Easing[easingType].Out);
  obj.expand    = new TWEEN.Tween(obj.position).to({z:opts.z2},tweenDuration).chain(xExpand).easing(TWEEN.Easing[easingType].Out);
  return obj;
};

utils.dull=function(composite){
	composite.children.forEach(function( shape ) {
		if (shape.grayness){
			shape.material.color.setRGB( shape.grayness, shape.grayness, shape.grayness );
			shape.material.opacity = 0;
		}
	});
};

utils.shine=function(composite,id){
	for (var i=0;i<composite.children.length;i++){
		if (composite.children[i].componentData.id===id && composite.children[i].material.color){
			composite.children[i].material.color.setRGB(1,1,0);
			if (composite.children[i].material.transparent){
			  composite.children[i].material.opacity=1;
			}
		}
	}
};