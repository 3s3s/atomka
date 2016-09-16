var utils = {};
var elements = {};

var g_nElement = 0;

elements.W = {
		E: 0.31,  			//Коэффициент излучения вольфрама
		Tmax: 3695,			//Температура плавления вольфрама
		alfa: 4.1E-3,		//Температурный коэффициент сопротивления
		q20: 55.0E-9,		//Удельное сопротивление при 20 градусах Цельсия
		q: function(T){		//Удельное сопротивление
			return this.q20*(1+this.alfa*(T+273-20));}
		
}
elements.Al1 = {
		E: 0.06,  			//Коэффициент излучения Алюминий полированный
		Tmax: 500,			//Максимальная температура
		alfa: 4.3E-3,		//Температурный коэффициент сопротивления
		q20: 27.0E-9,		//Удельное сопротивление при 20 градусах Цельсия
		q: function(T){		//Удельное сопротивление
			return this.q20*(1+this.alfa*(T+273-20));}
		
}
utils.constants = {
		element : [elements.W, elements.Al1],
		A: 1,		 		//работа выхода для оксида бария
		radius: 0.00015,	//Радиус нагретого тела в метрах
		len:	0.01,		//Длина нагретого тела в метрах
		U: 9				//напряжение на лампе накала
};

utils.getAverage = function(array, start, end)
{
	if (!array) return 0;
	if (!end || end > array.length) end = array.length;
	if (!start || start < 0 || start > end) start = 0;
	
	start = parseInt(start, 10);
	end = parseInt(end, 10);
	
	if (start == end) return 0;
	
	var sum = 0;
	for (var i=start; i<end; i++)
		sum += array[i];
	
	return sum/(end-start);
};

utils.getIntensivity = function(RGB, R)
{
	var max = utils.getMax(RGB);
	var ret = {};
	
	var maxScreen = 600;
	var step = maxScreen/Math.pow(255, 1/2);

	if (R < step)
		R = step;
	
	var J = 1/Math.pow(R/step, 2);
	
	var k = 1/Math.pow(2, 5/max);
	if (k > 1)
		k = 1;
	
	ret.R = J*((RGB[0]/max)*(255*k));
	ret.G = J*((RGB[1]/max)*(255*k));
	ret.B = J*((RGB[2]/max)*(255*k));
	
	return ret;
};

utils.getMax = function(array)
{
	if (!array || !array.length) return 0;
	
	var ret = array[0];
	for (var i=1; i<array.length; i++)
	{
		if (array[i] > ret) 
			ret = array[i];
	}
	return ret;
};

utils.setGroup = function(layer, element1, element2, callback)
{
	element2.remove().draggable(false);
	element1.remove().draggable(false);
	
	var group = new Kinetic.Group({draggable: true});
	
	if (callback)
		group.on('dragmove mouseup', callback);
	
	group.add(element1, element2);
	layer.add(group);
	
	return group;
};

utils.JoinPins = function(pin1, pin2)
{
	if (pin1.length != pin2.length) return null;

	return new Kinetic.Line({
		points: [pin1[0], pin1[1],
		         pin2[0], pin2[1]],
		stroke: 'black'
	});		
};

utils.JoinUpDown = function(layer, element1, element2, callback)
{
	if (!element1.pins) return;
	if (!element2.pins) return;
	
	var line = utils.JoinPins(element1.pins().up, element2.pins().down);
	
	var group = utils.setGroup(layer, element1.getKinetic(), element2.getKinetic(), callback);
	
	if (line)
	{
		group.add(line);
		group.pins = function(){
			return {
				up: element2.pins().up, 
				down: element1.pins().down};
		};
		group.getKinetic = function() {return group;};
	}
	
	return group;
};

utils.JoinPinsFine = function(pin1, pin2)
{
	if (pin1.length != pin2.length) return null;

	return new Kinetic.Line({
		points: [pin1[0], pin1[1],
		         pin2[0], pin1[1],
				 pin2[0], pin2[1]],
		stroke: 'black'
	});	
};
utils.JoinUpUp = function(layer, element1, element2, callback)
{
	if (!element1.pins) return;
	if (!element2.pins) return;
	
	var line = utils.JoinPinsFine(element1.pins().up, element2.pins().up);
	
	var group = utils.setGroup(layer, element1.getKinetic(), element2.getKinetic(), callback);
	
	if (line)
	{
		group.add(line);
		group.pins = function(){
			return {
				up: element1.pins().down, 
				down: element2.pins().down};
		};
		group.getKinetic = function() {return group;};
	}
	
	return group;
};

utils.Join = function(layer, element1, element2, callback)
{
	if (!element1.pins) return;
	if (!element2.pins) return;
	
	var lineUp = utils.JoinPinsFine(element1.pins().up, element2.pins().up);
	var lineDown = utils.JoinPinsFine(element1.pins().down, element2.pins().down);
	
	var group = utils.setGroup(layer, element1.getKinetic(), element2.getKinetic(), callback);
	
	if (lineUp) group.add(lineUp);
	if (lineDown) group.add(lineDown);
		
	if (lineUp && lineDown)
	{
		group.pins = function(){
			return {
				up: element1.pins().up, 
				down: element2.pins().down};
		};
		group.getKinetic = function() {return group;};
	}
	
	return group;
};

utils.staticButton = function(width, height, text, onclick)
{
	if (!width) width = 50;
	if (!height) height = 20;
	if (!text) text = "";
	
	var buttonRect = new Kinetic.Rect({
		width: width,
		height: height,
		fill: 'white',
		stroke: 'black',
		align: 'center'//,
		//originY: 'center'
	});
	
	var fontSize = 14;
	var buttonText = new Kinetic.Text({
		  text: text,
		  y: (buttonRect.height()-fontSize)/2,
		  fontSize: fontSize,
		  width: buttonRect.width(),
		  align: "center",
		  fill: 'black'
		  //originX: 'center'//,
		  //originY: 'top'
		});	
	
	var button = new Kinetic.Group({
		width: width,
		height: height
		});//[buttonRect, buttonText]);
	button.add(buttonRect, buttonText);
	button.on('click', onclick);
	/*button.onMouseup = function(e)
	{
//		if (this.containsPoint(e))
			alert("button.onMouseup");
	};//onclick;
	button.onMousemove = function() {};*/
	
	return button;	
};


var atomka = function(containerID) {
    var stage = new Kinetic.Stage({
        container: containerID,
        width: 1000,
        height: 600
      });
    
    this.layer = new Kinetic.Layer();
	stage.add(this.layer);

	//utils.setListeners(canvas);
	/*canvas.on("mouse:down", function(options)
			{
				alert(options.target.type);
			});*/
    this.batteries = [];
	this.lamps = [];
	this.vResistors = [];
	this.photoElements = [];
	this.voltMeters = [];
	this.amperMeters = [];
	this.monoHromators = [];
	
	/*this.showAll = function()
	{
		for (var i=0; i<this.lamps.length; i++)
			this.layer.add(this.lamps[i].getKinetic());
		for (var i=0; i<this.vResistors.length; i++)
			this.layer.add(this.vResistors[i].getKinetic());
		for (var i=0; i<this.photoElements.length; i++)
			this.layer.add(this.photoElements[i].getKinetic());
		for (var i=0; i<this.voltMeters.length; i++)
			this.layer.add(this.voltMeters[i].getKinetic());
		for (var i=0; i<this.monoHromators.length; i++)
			this.layer.add(this.monoHromators[i].getKinetic());
		for (var i=0; i<this.batteries.length; i++)
			this.layer.add(this.batteries[i].getKinetic());
		
		this.redraw();
	};*/
	this.ShowConstant = function(containerID, value, comment)
	{
		var container = document.getElementById(containerID);
		if (!container)
		{
			var node = document.createElement("span");   
			node.id = containerID;
			document.getElementById("info").appendChild(node);
			
			container = document.getElementById(containerID);
		}
		
		container.innerHTML = "<pre>" + value+" "+comment+"</pre>";		
	};
	this.ShowConstantPicture = function(containerID, header, value, comment)
	{
		var container = document.getElementById(containerID);
		container.innerHTML = "<pre>"+header+"</pre><table><tr><td><img src='" + value+"'></td><td> "+comment + "</td></tr></table>";				
	};
	this.redraw = function()
	{
		stage.draw();
	};
	
	this.addMonoHromator = function(coords, value, callback)
	{
		this.monoHromators.push(new atomka.MonoHromator(coords, value, callback));
		return this.monoHromators.length-1;				
	};
	this.addVoltMeter = function(coords, value, callback)
	{
		this.voltMeters.push(new atomka.VoltMeter(coords, value, callback));
		return this.voltMeters.length-1;				
	};
	this.addAmperMeter = function(coords, value, callback)
	{
		this.amperMeters.push(new atomka.AmperMeter(coords, value, callback));
		return this.amperMeters.length-1;				
	};
	
	this.addPhotoElement = function(coords, callback)
	{
		this.photoElements.push(new atomka.PhotoElement(coords, callback));
		return this.photoElements.length-1;		
	};
	
	this.addBattery = function(coords, value, callback)
	{
		this.batteries.push(new atomka.Battery(coords, value, callback));
		return this.batteries.length-1;
	};
	this.addLamp = function()
	{
		this.lamps.push(new atomka.Lamp());
		return this.lamps.length-1;
	};
	
	this.addVResistor = function()
	{
		this.vResistors.push(new atomka.VResistor());
		return this.vResistors.length-1;
	};
	this.setVResistor = function(index, coords, value, callback)
	{
		if (index >= this.vResistors.length)
			return;
			
		this.vResistors[index].Update(coords, value, callback);
	};
	/*this.showVResistor = function(index)
	{
		if (index >= vResistors.length)
			return;
		
		canvas.add(vResistors[index].getKinetic());
	};*/
};



atomka.Battery = function(coords, value, callback)
{
	this.coords = [0, 0];
	
	var obj = new atomka.box(150, 80, "Источник питания", "V");
	
	this.pins = function(){
		return {
			up: [obj.getKinetic().x()+obj.getKinetic().width()/2, obj.getKinetic().y()-20], 
			down: [obj.getKinetic().x()+obj.getKinetic().width()/2, obj.getKinetic().y()+obj.getKinetic().height()+20]};
	};

	var wireUp = new Kinetic.Line({
		points: [obj.getKinetic().x()+obj.getKinetic().width()/2, obj.getKinetic().y(), 
		         obj.getKinetic().x()+obj.getKinetic().width()/2, this.pins().up[1]],
		stroke: 'black'
	});
	var wireDown = new Kinetic.Line({
		points: [wireUp.attrs.points[0], obj.getKinetic().y()+obj.getKinetic().height(), 
		         this.pins().down[0], this.pins().down[1]],
		stroke: 'black'
	});
	
	var textMinus = new Kinetic.Text({
		  text: "-",
		  x: this.pins().up[0]-20,
		  y: this.pins().up[1]-10,
		  fontSize: 32,
		  fill: 'black',
		  align: 'center'//,
		  //originY: 'center'
		});	
		
	var textPlus = new Kinetic.Text({
		  text: "+",
		  x: this.pins().down[0]-20,
		  y: this.pins().down[1]-20,
		  fontSize: 30,
		  fill: 'black',
		  align: 'center'//,
		  //originY: 'center'
		});	

	obj.getKinetic().add(wireUp, wireDown, textPlus, textMinus);
	
	this.getKinetic = function()
	{
		return obj.getKinetic();
	};
	this.deltaU = 0.0;
	this.getValue = function()
	{
		this.deltaU += 0.00001;
		if (this.deltaU > 1) this.deltaU = 1;
		return parseFloat(obj.getVal())-this.deltaU+Math.random()*0.001;
	};
	
	this.Update = function(coords, value, callback)
	{
		if (coords) 
			this.coords = coords;
		else
			this.coords = [obj.getKinetic().x(), obj.getKinetic().y()];
		
		if (callback) obj.setPlusMinusCallback(callback);
		if (value || (value == "0.0")) obj.setVal(value);
		
		obj.getKinetic().x(this.coords[0]);
		obj.getKinetic().y(this.coords[1]);	
	};
	
	
	this.Update(coords, value, callback);
	return this;
};

atomka.PhotoElement = function(coords, callback)
{
	this.coords = [0, 0];
	//this.center = [this.coords[0]+15, this.coords[1]+40];
	var obj = new Kinetic.Group({
		x: this.coords[0],
		y: this.coords[1],
		draggable: true
		});
	
	var ellipse = new Kinetic.Ellipse({
		x: obj.x()+15,
		y: obj.y()+40,
		radius: {x: 10, y: 20},
		fillEnabled: false,
		stroke: 'black'
	});

	var rect = new Kinetic.Rect({
		x: obj.x(),
		y: obj.y(),
		width: ellipse.radiusX()*2+25,
		height: ellipse.radiusY()*2+40,
		fillEnabled: false,
		stroke: 'black'			
	});
	var text = new Kinetic.Text({
		x: rect.x()+rect.width() - 5,
		y: obj.y()+5,
		text: "Фотоэлемент",
		rotation: 90,
		fill: 'black',
		height: rect.height()-10,
		align: 'center',
		fontSize: 10			
	});

	this.pins = function()
	{
		return {
			up: [obj.x()+rect.width()/2, obj.y()-10], 
			down: [obj.x()+rect.width()/2, obj.y()+rect.height()+10]};
	};
	
	var wireUp = new Kinetic.Line({
		points: [obj.x()+rect.width()/2, obj.y(), 
		         obj.x()+rect.width()/2, obj.y()-10],
		stroke: 'black'});
	var wireDown = new Kinetic.Line({
		points: [wireUp.attrs.points[0], rect.y()+rect.height(), 
		         wireUp.attrs.points[0], rect.y()+rect.height()+10],
		stroke: 'black'});
	
	var textMinus = new Kinetic.Text({
		  text: "-",
		  x: this.pins().up[0]-15,
		  y: this.pins().up[1]-8,
		  fontSize: 20,
		  fill: 'black',
		  align: 'center'//,
		  //originY: 'center'
		});	
		
	var textPlus = new Kinetic.Text({
		  text: "+",
		  x: this.pins().down[0]-15,
		  y: this.pins().down[1]-10,
		  fontSize: 18,
		  fill: 'black',
		  align: 'center'//,
		  //originY: 'center'
		});	

	this.getKinetic = function()
	{
		return obj;
	};
	this.center = function()
	{
		return [obj.children[1].getAbsolutePosition().x, 
		        obj.children[1].getAbsolutePosition().y];
	};
	
	this.Update = function(coords, R, callback)
	{
		if (coords) this.coords = coords;
		
		obj.x(this.coords[0]);
		obj.y(this.coords[1]);	
		
		obj.on('dragmove mouseup', callback);
	};
	obj.add(rect, ellipse, text, wireUp, wireDown, textMinus, textPlus);	
	
	this.Update(coords, callback);
	return this;
};


atomka.Lamp = function(coords, temperature, callback) {
	
	if (!coords) coords = [10, 10];
	
	this.T = temperature;
	var radius = utils.constants.radius;
	var l = utils.constants.len;
	this.S = 2*Math.PI*radius*l;
	
	this.R = (l*utils.constants.element[g_nElement].q(this.T))/(Math.PI*Math.pow(radius, 2)); //Электрическое сопротивление
	
	var XY = 0;
	
	var obj = new Kinetic.Group({
		draggable: true
	});	
	
	var maxR = 7;
	var box = new Kinetic.Rect({
		x: coords[0] - maxR - 5,
		y: coords[1] - maxR - 5,
		width: maxR*2+10,
		height: maxR*2+10,
		fill: 'black'
	});
	obj.add(box);
	
	for (var i=0; i<maxR; i++)
	{
		obj.add(new Kinetic.Circle({
			  radius: i, 
			  y: coords[1],
			  x: coords[0],
			  fillEnabled: false
			}));
	}
	
	var rect = new Kinetic.Rect({
		x: box.x()-40,
		y: box.y()-30,
		width: box.width()+80,
		height: box.height()+40,
		stroke: 'black'
	});
	
	var label = new Kinetic.Text({
		text: "Нагретое тело",
		fill: 'black',
		align: 'center',
		width: rect.width(),
		fontSize: 14,
		x: rect.x(),
		y: rect.y()+5
	});

	var indexRect = obj.children.length;
	obj.add(rect, label);

	this.pins = function(){
		var rect = obj.children[indexRect];
		return {
			up: [rect.getAbsolutePosition().x-10, rect.getAbsolutePosition().y+rect.height()/2], 
			down: [rect.getAbsolutePosition().x+rect.width()/2, rect.getAbsolutePosition().y+rect.height()+38]};
	};

	var wireUp = new Kinetic.Line({
		points: [rect.x(), this.pins().up[1], 
		         this.pins().up[0], this.pins().up[1]],
		stroke: 'black'
	});
	var wireDown = new Kinetic.Line({
		points: [this.pins().down[0], rect.y()+rect.height(), 
		         this.pins().down[0], this.pins().down[1]],
		stroke: 'black'
	});
	
	obj.add(wireUp, wireDown);			

	this.getKinetic = function()
	{
		return obj;
	};
	this.center = function()
	{
		return [obj.children[1].getAbsolutePosition().x, 
		        obj.children[1].getAbsolutePosition().y];
	};
	
	this.Update = function(temperature, coords, callback)
	{
		if (!coords)
		{
			if (obj)
				coords = [obj.x(), obj.y()];
			else
			{
				if (XY)
					coords = XY;
				else
					coords = [10, 10];				
			}
		}
		if (!temperature)
			temperature = 3000;

		XY = coords;
		
		this.T = temperature;
		this.R = (l*utils.constants.element[g_nElement].q(this.T))/(Math.PI*Math.pow(radius, 2)); //Электрическое сопротивление
		
		var spectr = atomka.getSpectr(400, 1000, this.T);
		
		//var max = utils.getMax(spectr);//(atomka.maxSpectr);
		
		var B = utils.getAverage(spectr, 0, spectr.length/3);
		var G = utils.getAverage(spectr, spectr.length/3, 2*spectr.length/3);
		var R = utils.getAverage(spectr, 2*spectr.length/3, spectr.length);
				
		if (XY)
		{
			obj.x(XY[0]);
			obj.y(XY[1]);			
		}
		
		for (var i=1; i<obj.children.length-4; i++)
		{
			var J = utils.getIntensivity([R, G, B], i+1);
			obj.children[i].stroke('rgb('+
					parseInt(J.R)+', '+
					parseInt(J.G)+', '+
					parseInt(J.B)+')');			
		}
				
		if (callback)
			obj.on('dragmove mouseup', callback);
	};	
	
	this.Update(temperature, coords, callback);
	return this;
};

atomka.box = function(width, height, label, units)
{
	if (!width) width = 150;
	if (!height) height = 100;
	if (!label) label = "";
	if (!units) units = "";
	
	var widthCurrent = width;
	var heightCurrent = height;
	var nBoxStep = 1;
	
	var rect = new Kinetic.Rect({
			width: widthCurrent,
			height: heightCurrent,
			fill: 'white',
			stroke: 'black'//,
			//align: 'center'//,
			//originY: 'top'
		});
	
	var textLabel = new Kinetic.Text({
		  text: label,
		  y: 5,
		  width: widthCurrent,
		  fontSize: 14,
		  fill: 'black',
		  align: 'center'//,
		  //originY: 'center'
		});	
	
	var display = new Kinetic.Rect({
		y: 25,
		x: 15,
		width: widthCurrent-60,
		height: 30,
		fill: 'white',
		stroke: 'black'//,
		//align: 'right'//,
		//originY: 'center'
	});
	var textUnits = new Kinetic.Text({
		  text: units,
		  y: display.y(),
		  width: widthCurrent,
		  fontSize: 24,
		  padding: 5,
		  fill: 'black',
		  align: 'right'//,
		  //originY: 'center'
		});	
	
	var textValue = new Kinetic.Text({
		  x: display.x(),
		  y: display.y()+3,
		  width: display.width(),
		  height: 10,
		  fontSize: 16,
		  padding: 5,
		  fill: 'black',
		  align: 'right'//,
		  //originY: 'center'
		});	
	
	this.setVal = function(value)
	{
		textValue.text(value+"");
		
		if (callbackPlusMinus)
			callbackPlusMinus(textValue.text());
	};
	this.getVal = function()
	{
		return textValue.text();
	};
	
	var callbackPlusMinus = 0;
	this.setPlusMinusCallback = function(callback)
	{
		callbackPlusMinus = callback;		
	};
	
	var buttonsStep = [];
	this.addPlusMinus = function(callback, bAllowNegative)
	{
		var valueCurrent = textValue.text();
		if (!valueCurrent) valueCurrent = 0;
		
		this.setPlusMinusCallback(callback);
		
		var less = new utils.staticButton(20, 20, "<<", function() 
				{
					valueCurrent = parseInt(textValue.text());
					if (!bAllowNegative)
					{
						if (valueCurrent-nBoxStep < 0)
							valueCurrent = nBoxStep;
						if (!valueCurrent || valueCurrent < 0)
							valueCurrent = nBoxStep;
					}
						
					textValue.text(valueCurrent-nBoxStep+"");
					groupBox.draw();
					
					callbackPlusMinus(textValue.text());
					
				});
		var more = new utils.staticButton(20, 20, ">>", function() 
				{
					valueCurrent = parseInt(textValue.text());
					textValue.text(valueCurrent+nBoxStep+"");
					groupBox.draw();
					
					callbackPlusMinus(textValue.text());
					
				});
		
		less.y(rect.y()+rect.height()-less.height()-5);
		more.y(less.y());
		
		more.x(less.x()+less.width()+5); 
		
		var group = new Kinetic.Group();
		group.add(less, more);
		group.width(more.x()+more.width()-less.x());
		group.height(less.height());
		
		group.x(groupBox.x()+groupBox.width()-group.width()-5);
		
		groupBox.add(group);
		
		for (var i=0; i<3; i++)
		{
			var buttonStep = new Kinetic.Circle({
				  radius: 5, 
				  y: rect.y()+rect.height()-20,
				  x: 25*(i+1), 
				  stroke: "white",
				  fill: 'rgb('+100+', '+100+', '+100+')'		
			});
			var buttonLabelStep = new Kinetic.Text({
				  text: Math.pow(10, i),
				  width: 20,
				  fontSize: 10,
				  fill: 'black',
				  align: 'center',
				  y: buttonStep.y()+buttonStep.radius()+2,
				  x: buttonStep.x()-11
			});
			
			if (i+1 == nBoxStep)
				buttonStep.stroke("red");
			
			buttonStep.eventParam = {val: i};
			
			buttonStep.on("click", function()
					{
						for (var j=0; j<buttonsStep.length; j++)
							buttonsStep[j].children[0].stroke("white");
						
						nBoxStep = Math.pow(10, this.eventParam.val);
						this.stroke("red");
						groupBox.draw();
					});
			
			var group = new Kinetic.Group();
			group.add(buttonStep, buttonLabelStep);
			
			buttonsStep.push(group);
		}
		
		for (var i=0; i<buttonsStep.length; i++)
			groupBox.add(buttonsStep[i]);
	};
	
	var groupBox = new Kinetic.Group({
		draggable: true
	});
	groupBox.add(
			rect, textLabel, display, textValue, textUnits
			);
	
	groupBox.width(rect.width());
	groupBox.height(rect.height());
	//groupBox.on("selected", function(){console.log("12345");});
	this.getKinetic = function()
	{
		return groupBox;
	};
	return this;
};

atomka.MonoHromator = function(coords, value, callback)
{
	this.coords = [10, 10];
	
	var obj = new atomka.box(150, 100, "Монохроматор", "нм");
	obj.addPlusMinus(callback);	
	
	this.getKinetic = function()
	{
		return obj.getKinetic();
	};
	this.getValue = function()
	{
		return obj.getVal();
	};
	this.Update = function(coords, value, callback)
	{
		if (coords) 
			this.coords = coords;
		else
			this.coords = [obj.getKinetic().x(), obj.getKinetic().y()];

		if (callback) obj.setPlusMinusCallback(callback);
		if (value) obj.setVal(value);
		
		obj.getKinetic().x(this.coords[0]);
		obj.getKinetic().y(this.coords[1]);		
	};


	this.Update(coords, value, callback);
	return this;
};

atomka.MultiMeter = function(coords, value, box, callback)
{
	this.coords = [0, 0];
	
	var obj = box;//new atomka.box(150, 80, "Вольтметр", "V");
	
	this.pins = function(){
		return {
			up: [obj.getKinetic().x()+obj.getKinetic().width()/2, obj.getKinetic().y()-10], 
			down: [obj.getKinetic().x()+obj.getKinetic().width()/2, obj.getKinetic().y()+obj.getKinetic().height()+10]};
	};

	var wireUp = new Kinetic.Line({
		points: [this.pins().up[0], obj.getKinetic().y(), 
		         this.pins().up[0], this.pins().up[1]],
		stroke: 'black'
	});
	var wireDown = new Kinetic.Line({
		points: [wireUp.attrs.points[0], obj.getKinetic().y()+obj.getKinetic().height(), 
		         this.pins().down[0], this.pins().down[1]],
		stroke: 'black'
	});
	
	obj.getKinetic().add(wireUp, wireDown);
	
	this.getKinetic = function()
	{
		return obj.getKinetic();
	};
	this.getValue = function()
	{
		return obj.getVal();
	};
	
	this.Update = function(coords, value, callback)
	{
		if (coords) 
			this.coords = coords;
		else
			this.coords = [obj.getKinetic().x(), obj.getKinetic().y()];
		
		if (callback) obj.setPlusMinusCallback(callback);
		if (value || (value == "0.0")) obj.setVal(value);
		
		obj.getKinetic().x(this.coords[0]);
		obj.getKinetic().y(this.coords[1]);	
	};
	
	
	this.Update(coords, value, callback);
	return this;
};

atomka.VoltMeter = function(coords, value, callback)
{
	return new atomka.MultiMeter(coords, value, new atomka.box(150, 80, "Вольтметр", "V"), callback);
};
atomka.AmperMeter = function(coords, value, callback)
{
	return new atomka.MultiMeter(coords, value, new atomka.box(150, 80, "Амперметр", "mA"), callback);
};

atomka.VResistor = function(coords, value, callback)
{
	var obj = null;
//	var Val = value;
	
	this.getKinetic = function()
	{
		if (!obj) return null;
		
		return obj.getKinetic();
	};
	this.getValue = function()
	{
		return obj.getVal();
	};
	this.setValue = function(value)
	{
		return obj.setVal(value);
	};
	
	this.Update = function(coords, value, callback)
	{
		if (!value)
			value = 0;
		if (!coords)
			coords = [100, 100];
			
		//Val = value;
		
		if (!obj)
		{
			obj = new atomka.box(150, 100, "Сопротивление", "Ом");
			obj.addPlusMinus(callback);				

			this.pins = function(){
				return {
					up: [obj.getKinetic().x()-10, obj.getKinetic().y()+obj.getKinetic().height()/2], 
					down: [obj.getKinetic().x()+obj.getKinetic().width()+10, obj.getKinetic().y()+obj.getKinetic().height()/2]};
			};

			var wireDown = new Kinetic.Line({
				points: [obj.getKinetic().x(), this.pins().up[1], 
				         this.pins().up[0], this.pins().up[1]],
				stroke: 'black'
			});
			var wireUp = new Kinetic.Line({
				points: [obj.getKinetic().x()+obj.getKinetic().width(), this.pins().down[1], 
				         this.pins().down[0], this.pins().down[1]],
				stroke: 'black'
			});
			
			obj.getKinetic().add(wireUp, wireDown);
		}
		
		obj.setPlusMinusCallback(callback);
		
		obj.getKinetic().x(coords[0]);
		obj.getKinetic().y(coords[1]);
		obj.setVal(value);	
	
	};
	
	this.Update(coords, value, callback);
	return this;
};

atomka.DensityOfEnergy = function(lambdaNanometers, T)
{
	var L = lambdaNanometers;
	var pi = Math.PI;
		
	//var exp = Math.exp((2*pi*(1.054E-34)*(3E+8))/((L*1E-9)*(1.38E-23)*T));
	var exp = Math.exp((3*6.67E+6)/(L*1.38*T));
	if (exp == 1)
		exp = 1.00001;
		
	//return (1E+16)*(2*3.14*6.67*9)/(Math.pow(L, 5)*(exp - 1));
	return (2*pi*6.67E+27*9)/(Math.pow(L, 5)*(exp - 1));
	
//	return (1E+27)*(4*pi*1.054*9)/(Math.pow(L, 5)*(exp - 1));
	
};

atomka.getSpectr = function(lMin, lMax, T)
{
	var ret = [];
	var step = (lMax-lMin)/1000;
		
	for (var l=lMin; l<lMax; l+=step)
		ret.push(atomka.DensityOfEnergy(l, T));
		
	return ret;
};
/**
 * @memberOf window
 */
window.onload = function(e){ 
   

	var laba11 = new atomka("container");
	
	laba11.onVResistorChanged = function(vResistorValue)
	{
		var R = parseFloat(vResistorValue) + parseFloat(laba11.lamps[0].R);
		var U = laba11.batteries[0].getValue();
		var I = U/R;
		var P = I*U;
		var S = laba11.lamps[0].S;
		var E = utils.constants.element[g_nElement].E;  //Коэффициент излучения нагретого тела
		var sigma = 5.6704E-8;
		
		var T = Math.pow(P/(S*E*sigma), 1/4);
		if (T > utils.constants.element[g_nElement].Tmax)
		{
			var delta = 1;
			if (vResistorValue > 5)
				delta = 50;
				
			laba11.vResistors[0].setValue(parseInt(vResistorValue)+delta);
			return;		
		}
		
		laba11.lamps[0].Update(T);
		
		laba11.onPhotoElementMoved();
		
		laba11.redraw();
		
		//laba11.ShowConstantPicture("LampT", "Температура нагретого тела", "https://dl.dropboxusercontent.com/s/axfbi1qf8r0vx2n/CodeCogsEqn.gif", " = " + Math.round(T) + " K");
	};
	laba11.onPhotoElementMoved = function()
	{
		var distance = 
			Math.pow(laba11.lamps[0].center()[0]-laba11.photoElements[0].center()[0], 2)+
			Math.pow(laba11.lamps[0].center()[1]-laba11.photoElements[0].center()[1], 2);
			
		//alert(Math.pow(distance, 0.5));
		
		//var Amperage = 1/(distance*1.6E-19);
		var U = 0;

		var spectr = 0;
		var spectr2 = 0;
		var L = 0;
		if (laba11.monoHromators.length)
		{
			L = parseInt(laba11.monoHromators[0].getValue());
			spectr = atomka.getSpectr(L-1, L+1, laba11.lamps[0].T);	
			spectr2 = atomka.getSpectr(0, 1000, laba11.lamps[0].T);	
			
			//Voltage = spectr[500]*Voltage;
			
			var A = utils.constants.A; //работа выхода фотоэлемента

			U = 1250/L - A;//(1242/L - A)*1.0E-19; //зависимость напряжения от частоты при фотоэффекте
			
			if (U < 0) U=0;
			
			U = U*spectr[500];
		}
		
		var scale = 0.000001;
		var amperageResult = scale*U/distance;
		
		for (var n=0;n<spectr2.length;n++)
			spectr2[n] = (spectr2[n]*scale)/distance;
		for (var n=0;n<spectr.length;n++)
			spectr[n] = (spectr[n]*scale)/distance;
		
		if (amperageResult < 1.0E-6)
			amperageResult = "0.0";
		if (amperageResult > 1000000)
			amperageResult = "infinity";
		/*		
		var voltageResult = scale*Voltage*U;
		
		if (voltageResult < 1.0E-6)
			voltageResult = "0.0";
		if (voltageResult > 1000000)
			voltageResult = "infinity";
		
		laba11.voltMeters[0].Update(0, voltageResult);*/
		var R = parseFloat(laba11.vResistors[0].getValue()) + parseFloat(laba11.lamps[0].R);
		var U = laba11.batteries[0].getValue();
		var amperageResult2 = U/R;
		
		laba11.amperMeters[0].Update(0, amperageResult);
		laba11.amperMeters[1].Update(0, amperageResult2);
		laba11.redraw();
		
		//var check = (1000*Voltage*U)/(1241/L - A)
		laba11.ShowConstantPicture("Epsilon", "Спектральная плотность излучения", "https://dl.dropboxusercontent.com/s/9047r939wxz99o5/CodeCogsEqn3.gif", "");
		laba11.ShowConstant("AmperOut", "Tok на фотоэлементе<br>I = " + (""+amperageResult).substr(0, 9), "mA");
		laba11.ShowConstant("a_lambda_T", "Поглощательная способность нагретого тела<br>a = " + utils.constants.element[g_nElement].E, "");
		laba11.ShowConstant("distance", "Расстояние от нити до фотоэлемента<br>r = " + (""+Math.pow(distance, 0.5)).substr(0, 3), "мм");
		
		if (spectr != 0 && spectr.length > 0)
		{
			/*laba11.ShowConstant("Temperature", "Температура нити накала<br>T = " + laba11.lamps[0].T, "K");
			laba11.ShowConstant("EpsTheor", "Плотность излучения теоретическая<br>е = " + spectr[500], "");*/
			/*var nu = 3.0E+8/(L*1.0E-9);
			var exp = Math.exp((3*6.67E+6)/(L*1.38*laba11.lamps[0].T));
			laba11.ShowConstant("EpsTheor2", "Плотность излучения теоретическая<br>е = " + (6.28*6.67E-34*Math.pow(nu, 3))/(9.0E+16*(exp - 1)), "");
			laba11.ShowConstant("EpsTheor3", "Плотность излучения теоретическая<br>е = " + ((2*3.14*6.67E+27*9)/(Math.pow(L, 5)*(exp - 1))), "");
			//laba11.ShowConstant("EpsTheor4", "Last<br>е = " + (4*3.14*3.14*1.05E-34*9.0E+16)/(Math.pow(L*1.0E-9, 5)*(exp - 1)), "");*/
			//laba11.ShowConstant("Experiment", "Плотность излучения по верхней формуле<br>е = " + (1.6E-19*Voltage)/(6.67E-34*(3.0E+8/(L*1.0E-9))-1.6E-19*utils.constants.A), "");
			/*var upperFormula = ((1.6E-19*voltageResult)/U);
			laba11.ShowConstant("Check", "Плотность излучения по верхней формуле<br>е = " + upperFormula, "");
			laba11.ShowConstant("Rad", "Расстояние<br>R = " + Math.pow((spectr[500]*scale)/upperFormula, 0.5), "");*/
		}
	};
	laba11.onMonohromatorChanged = function()
	{
		laba11.onPhotoElementMoved();
		
	};

	laba11.addBattery([-30, 250], utils.constants.U);
	
	//var density4 = atomka.DensityOfEnergy(700, 4000);
	//var density5 = atomka.DensityOfEnergy(600, 5000);
	
	laba11.addLamp();
	laba11.addVResistor();
	laba11.addPhotoElement([595, 100], laba11.onPhotoElementMoved);
	//laba11.addVoltMeter([700, 100], 0);
	laba11.addAmperMeter([700, 100], 0);
	laba11.addAmperMeter([235, 250], 0);
	laba11.addMonoHromator([400, 90], 200, laba11.onMonohromatorChanged);
	
	laba11.lamps[0].Update(0, [300, 140], laba11.onPhotoElementMoved);
	
	laba11.setVResistor(0, [80, 90], 1, laba11.onVResistorChanged);
	
	//laba11.showAll();
	
	//var group1 = utils.Join(laba11.layer, laba11.voltMeters[0], laba11.photoElements[0]);
	var group1 = utils.Join(laba11.layer, laba11.amperMeters[0], laba11.photoElements[0]);
	var group11 = utils.JoinUpDown(laba11.layer, laba11.lamps[0], laba11.vResistors[0]);
	var group12 = utils.JoinUpUp(laba11.layer, group11, laba11.batteries[0]);
	var group13 = utils.Join(laba11.layer, group12, laba11.amperMeters[1]);
	var group2 = utils.setGroup(laba11.layer, group1, laba11.monoHromators[0].getKinetic());
	var group3 = utils.setGroup(laba11.layer, group2, group13); //laba11.lamps[0].getKinetic());
	//var group4 = utils.setGroup(laba11.layer, group3, laba11.vResistors[0].getKinetic());
	
	group3.x(120);

	laba11.redraw();
	
	//laba.showLamp(0);
	//laba.showLamp(1);
	window.setInterval(function() {laba11.onVResistorChanged(laba11.vResistors[0].getValue())}, 1000);
	//laba11.onPhotoElementMoved();
	//laba11.ShowConstant("LampS", "Площадь нагретого тела<br>S = "+(laba11.lamps[0].S+"").substring(0, 10), "кв.м");
	//laba11.ShowConstant("LampE", "Коэффициент излучения нагретого тела<br>E = " + utils.constants.E, "");
	//laba11.ShowConstant("LampR", "Электрическое сопротивление нагретого тела<br>R = " + (laba11.lamps[0].R+"").substring(0, 4), "Ом");
	laba11.ShowConstant("Aout", "Работа выхода фотоэлемента<br>A<sub>out</sub> = " + utils.constants.A, "эВ");

	return;
};