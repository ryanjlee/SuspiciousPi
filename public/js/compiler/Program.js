var Program = function () {
  this.programSteps = [];
  this.components = [];
  this.scopes = {
    '0': {}
  };
  this._objects = {};
  this._functions = {};
  this._currentScope = 0;
  this._blockStack = [0];
  this._scopeStack = [0];
  this._code = '';
  this.stepLines = [];

  this.initialize();
}

Program.prototype.setCode = function (rawCode) {
  this._code = rawCode;
}

//----------------------------------------------------------------------------------
// Object tracking methods
Program.prototype.registerObject = function (object) {
  var id = this.components.length;
  Object.defineProperty(object, '___id', { enumerable: false, value: id });
  Object.defineProperty(object, '___parsed', { enumerable: false, value: false, writable: true });
  Object.defineProperty(object, '___accessor', { enumerable: false, value: undefined, writable: true });


  if (Array.isArray(object)) {
    this.addComponent('array');
  } else  {
    this.addComponent('object');
  }
  this._objects[id] = object;
}

Program.prototype.newFunctionId = function () {
  return this.components.length;
}

Program.prototype.registerFunction = function (fn) {
  var id = this.components.length;

  Object.defineProperty(fn, '___id', { enumerable: false, value: id });
  Object.defineProperty(fn, '___accessor', { enumerable: false, value: undefined, writable: true });

  this.addComponent('function');

  return id;
}

Program.prototype.registerObjectProperties = function (object, name) {
  var type = Array.isArray(object) ? 'element' : 'property';
  for (var key in object) {
    var value = object[key];
    var accessor = name + '[' + key + ']';

    var component = this.addComponent(type, key);
    component.parent = object.___id;
    this.scopes[this.getCurrentScope()][accessor] = component.id;  

    if (typeof value === 'object') {
      this.addStep(component.id, 'pointer', value.___id, line);
      this.registerObjectProperties(value, accessor);
    } else if (typeof value === 'function') {
      this.addStep(component.id, 'pointer', value.___id, line);
    } else {
      this.addStep(component.id, 'value', value, line);
    }
  }

  this.objectSnapshot(object);

  object.___parsed = true;
}

Program.prototype.setObjectAcessor = function (object, accessor, name) {
  object.___accessor = accessor;
  object.___name = name;
}

//----------------------------------------------------------------------------------
// Object tracking methods
Program.prototype.registerObject = function (object) {
  var id = this.components.length;
  Object.defineProperty(object, '___id', { enumerable: false, value: id });
  Object.defineProperty(object, '___parsed', { enumerable: false, value: false, writable: true });
  Object.defineProperty(object, '___accessor', { enumerable: false, value: undefined, writable: true });
  Object.defineProperty(object, '___name', { enumerable: false, value: undefined, writable: true });


  if (Array.isArray(object)) {
    this.addComponent('array');
  } else  {
    this.addComponent('object');
  }
  this._objects[id] = object;
}

Program.prototype.newFunctionId = function () {
  return this.components.length;
}

Program.prototype.registerFunction = function (fn) {
  var id = this.components.length;

  Object.defineProperty(fn, '___id', { enumerable: false, value: id });
  Object.defineProperty(fn, '___accessor', { enumerable: false, value: undefined, writable: true });
  Object.defineProperty(fn, '___name', { enumerable: false, value: undefined, writable: true });

  this.addComponent('function');

  return id;
}

Program.prototype.registerObjectProperties = function (object, name, line) {
  var type = Array.isArray(object) ? 'element' : 'property';
  for (var key in object) {
    var value = object[key];
    var accessor = name + '[' + key + ']';

    var component = this.addComponent(type, key);
    component.parent = object.___id;
    this.scopes[this.getCurrentScope()][accessor] = component.id;  

    if (typeof value === 'object') {
      this.addStep(component.id, 'pointer', value.___id, line);
      this.registerObjectProperties(value, accessor);
    } else if (typeof value === 'function') {
      this.addStep(component.id, 'pointer', value.___id, line);
    } else {
      this.addStep(component.id, 'value', value, line);
    }
  }

  this.objectSnapshot(object);

  object.___parsed = true;
}

Program.prototype.setObjectAcessor = function (object, accessor, name) {
  object.___accessor = accessor;
  object.___name = name;
}

//----------------------------------------------------------------------------------
// Initialization and getter for the AppStore to access the relevant data properties
Program.prototype.initialize = function () {
  this.addComponent('block', 'global');
}

Program.prototype.getData = function () {
  return {
    programSteps: this.programSteps,
    components: this.components,
    scopes: this.scopes,
    lines: this.stepLines,
    code: this._code,
    wrappedCode: this._wrappedCode
  }
}

//----------------------------------------------------------------------------------
// Block and Scope get methods
Program.prototype.getCurrentBlock = function () {
  return this._blockStack[this._blockStack.length - 1];
}

Program.prototype.getCurrentScope = function () {
  // Check to see if the current scope is being modified by a pending function return
  this.setScope();
  return this._currentScope;
}

Program.prototype.setScope = function () {
  var top = this._scopeStack[this._scopeStack.length - 1];
  if (this.getCurrentScope !== top) {
    this._currentScope = top;
  }
}


//----------------------------------------------------------------------------------
// Step methods
Program.prototype.makeStep = function (id, key, value) {
  var step = {id : id};

  if (value === undefined) { value = '___undefined'; }
  step[key] = value;
  return step;
}

Program.prototype.addStep = function (name, key, value, line) {

  if (typeof name === 'number') { var id = name; } 
  else { var id = this.getId(name); }

  var step = this.makeStep(id, key, value);
  this.programSteps.push(step);

  var stepLine = {
    id: id,
    line: line
  }

  this.stepLines.push(stepLine);

  return step;
}



//----------------------------------------------------------------------------------
// Component methods
Program.prototype.makeComponent = function (type, name) {
  var id = this.components.length;
  var component = {
    id: id,
    type: type,
    name: name,
    block: this.getCurrentBlock(),
    scope: this.getCurrentScope(),
    createdAt: this.programSteps.length
  }
 return component;
}

Program.prototype.addComponent = function (type, name) {
  var component = this.makeComponent(type, name);
  this.components.push(component);
  return component;
}

Program.prototype.instantiate = function (name, key, value, line) {
  
  var component = this.addComponent('var', name);
  var id = component.id;
  this.addStep(id, key, value, line);

  this.scopes[this.getCurrentScope()][name] = component.id;
  return component;
}



//----------------------------------------------------------------------------------
// Get methods
Program.prototype.getId = function (name) {
  var id;

  // Search for the object in a given scope
  var searchScope = function (scope) {
    if (this.scopes[scope][name]) {
      id = this.scopes[scope][name];
    } else if (scope > 0) {
      var parentScope = this.components[scope].scope;
      searchScope(parentScope);
    }
  }.bind(this);
  searchScope(this.getCurrentScope());

  return id;
}

Program.prototype.getComponent = function (id) {
  return this.components[id] || 0;
}


//----------------------------------------------------------------------------------
// Loop / if block operators
Program.prototype.openBlock = function (type, value, line) {
  var id = this.components.length;
  var component = this.makeComponent('block', type);

  // Add number of branches for if statement
  if (type === 'if') {
    component.paths = value;
  }
  this.components.push(component);
  this.addStep(id, type, value, line);

  this._blockStack.push(id);
}

Program.prototype.cycleBlock = function (line) {
  var id = this.getCurrentBlock();
  var type = this.getComponent(id).name;
  this.addStep(id, type, 'cycle', line);
}

Program.prototype.closeBlock = function (line) {
  var id = this.getCurrentBlock();
  var type = this.getComponent(id).name;
  this.addStep(id, type, 'close', line);

  this._blockStack.pop();  
}

Program.prototype.enterPath = function (value, line) {
  var id = this.getCurrentBlock();
  var type = this.getComponent(id).name;
  this.addStep(id, 'enter', value, line);
}





//----------------------------------------------------------------------------------
// External methods of the ___Program object
Program.prototype.set = function (name, value, line, param) {
  if (value && typeof value === 'object') {
    var objectId = value.___id;
    if ( !this.getId(name) ) {
      var component = this.instantiate(name, 'pointer', objectId, line);
      component.type = param || 'var';
      this.setObjectAcessor(value, component.id, name);
    } else {
      this.addStep(name, 'pointer', objectId, line);
    }
    if (!value.___parsed) {
      this.registerObjectProperties(value, name);
    }

  } else if (typeof value === 'function') {
    var functionId = value.___id;
    if ( !this.getId(name) ) {
      var component = this.instantiate(name, 'pointer', functionId, line);
      component.type = param || 'var';
      this.setObjectAcessor(value, component.id, name);
    } else {
      this.addStep(name, 'pointer', functionId, line);
    }
  } else {
    if (param) {
      var component = this.instantiate(name, 'value', value, line);
      component.type = 'param';
    } else if ( !this.getId(name) ) {
      this.instantiate(name, 'value', value, line);
    } else {
      this.addStep(name, 'value', value, line);
    }
  }

}

Program.prototype.param = function (name, value, line) {
  this.set(name, value, line, 'param');
}

Program.prototype.loop = function (type, state, line) {
  this.setScope();
  if (state === 'open') {
    this.openBlock(type, state, line);
  } else if (state === 'cycle') {
    this.cycleBlock(line);
  } else if (state === 'close') {
    this.closeBlock(line);
  }
}

Program.prototype.block = function (type, state, line) {
  this.setScope();
  if (type === 'if') {
    if (state === 'close') {
      this.closeBlock(line);
    } else {
      this.openBlock(type, state, line);
    }
  }
}

Program.prototype.enter = function (type, value, line) {
  if (type === 'if') {
    this.enterPath(value, line);
  }
}

Program.prototype.invoke = function (functionId, line) {
  var component = this.makeComponent('invoke', this.getFunctionName(functionId));
  component.function = functionId;
  this.components.push(component);

  this.addStep(component.id, 'invoke', functionId, line);

  this._scopeStack.push(component.id);
  this._currentScope = component.id;;
  this.scopes[component.id] = {};
}

Program.prototype.method = function(name, line) {
  this.invoke(name, line);
}

Program.prototype.getFunctionName = function (functionId) {
  for (var i = this.programSteps.length - 1; i >= 0; i--) {
    var step = this.programSteps[i];
    if (step.pointer === functionId) {
      return this.components[step.id].name;
    }
  }
}





//----------------------------------------------------------------------------------
// Id acquisition from the scope stack / scope chain / Object reference chain
Program.prototype.getFunctionId = function (functionName) {
  var id;

  var traverse = function (scopeId) {
    var scope = this.scopes[scopeId]
    if (scope[functionName]) {
      id = scope[functionName];
    } else {
      var nextScope = this.getComponent(scopeId).scope;
      traverse(nextScope);
    }
  }.bind(this);

  traverse( this.getCurrentScope() );
  return id;
}

Program.prototype.lastIdOfObject = function (parentId) {
  for (var i = this.programSteps.length - 1; i >= 0; i--) {
    var step = this.programSteps[i];
    if (step.id === parentId) {
      return step.pointer;
    }
  }
}

//----------------------------------------------------------------------------------
// Object comprehension methods
Program.prototype.setObjectProperty = function (fullObjectString, parent, key, line) {

  var parentObjectString = fullObjectString.substring(0, fullObjectString.lastIndexOf('['));
  if (key === undefined) {
    key = fullObjectString.substring(fullObjectString.lastIndexOf('['), fullObjectString.lastIndexOf(']'));
  }

  var lookupString = parentObjectString + '[' + key + ']';
  var id = this.getId(lookupString );
  
  var value = parent[key];
  var parentId = parent.___id;
  var pointerId = value.___id;
  
   // Check to see if the object property being set is already defined
  if (id) {
    if (this.components[id].type === 'var') { 

      this.components[id].type = 'property';
      this.components[id].name = key;
      this.components[id].parent = parentId;
    } else if (typeof value === 'object') {
      this.addStep(this.components.length + 1, 'pointer', pointerId, line);
    } else {
      this.addStep(id, 'value', value, line);
    }
  } 
  else { // Object/property was not found, therefor a new property is being defined.
    var memberName = this.components[parentId].type === 'array' ? 'element' : 'property';

    if (value && typeof value === 'object') {
      var component = this.instantiate(fullObjectString, 'pointer', pointerId, line);
      component.name = key;
      component.type = memberName;
      component.parent = parentId;
    } else if (typeof value === 'function') {
      var component = this.instantiate(fullObjectString, 'pointer', pointerId, line);
      component.name = key;
      component.type = memberName === 'property' ? 'method': 'function'
      component.parent = parentId;
    } else {
      var component = this.instantiate(fullObjectString, 'value', value, line);
      component.name = key;
      component.type = memberName;
      component.parent = parentId;
    }
  }

  this.objectSnapshot(parent, line);
}

Program.prototype.objectSnapshot = function (object, line) {
  if (Array.isArray(object)) {
    var step  = this.addStep(object.___id, 'length', object.length, line);
    step.snapshot = JSON.stringify(object);
  } else if (object && typeof object === 'object') {
    var step  = this.addStep(object.___id, 'snapshot', JSON.stringify(object), line);
  }
}



//----------------------------------------------------------------------------------
// Function return methods
Program.prototype.return = function (name, line) {
  var id = this.getCurrentScope();

  var step = this.addStep(id, 'return', this.returnState, line);
  if (this.returnState && typeof this.returnState === 'object') {
    step.return = { 
      pointer: this.returnState.___id,
      snapshot: JSON.stringify(this.returnState)
    }
  } else if (typeof this.returnState === 'function') {
    step.return = {
      pointer: this.returnState.___id
    }
  } else {
    if (this.returnState === undefined) { this.returnState = '___undefined' }
    step.return = { value: this.returnState };
  }

  this._scopeStack.pop();
  this.resetBlock();
}

Program.prototype.resetBlock = function () {
  var top = this.getCurrentBlock();

  var block = this.getComponent(top);
  if ( block !== 0 ) {
    if ( block.scope !== this.getCurrentScope() ) {
      this._blockStack.pop();
      this.resetBlock();
    }
  }
}








//----------------------------------------------------------------------------------
// Special Built-In method handling
Program.prototype.nativeArrayPush = function (array) {
  if (array.___id) {
    var element = this.addArrayElementComponent(array, array.length - 1);
    var value = array[array.length - 1];
    this.addArrayElementStep(element, value);

    this.objectSnapshot(array);
  }
}

Program.prototype.nativeArrayPop = function (array) {
  if (array.___id) {
    this.objectSnapshot(array);
  }
}

Program.prototype.nativeArrayShift = function (array) {
  if (array.___id) {
    this.updateArrayValues(array);
    this.objectSnapshot(array);
  }
}

Program.prototype.nativeArrayUnshift = function (array) {
  if (array.___id) {
    this.updateArrayValues(array);
    this.objectSnapshot(array);
  }
}

Program.prototype.nativeArraySplice = function (array) {
  if (array.___id) {
    this.updateArrayValues(array);
    this.objectSnapshot(array);
  }
}


//----------------------------------------------------------------------------------
// Special Built-In method helpers
Program.prototype.updateArrayValues = function (array) {
  var lastIndex = 0;
  
  for (var i = 0; i < this.components.length; i++) {
    var element = this.components[i];
    if (element.parent === array.___id && element.name < array.length) {
      var value = array[element.name];
      this.addArrayElementStep(element, value);
      if ((element.name * 1) > lastIndex) { lastIndex = (element.name * 1); }
    }
  }

  for (var j = lastIndex + 1; j < array.length; j++) {
    var value = array[j];
    var element = this.addArrayElementComponent(array, j)
    this.addArrayElementStep(element, value);
  }
}

Program.prototype.addArrayElementComponent = function (array, elementNumber) {
  var element = this.addComponent('element', elementNumber);
  element.parent = array.___id;
  var accessorName = this.getComponent( array.___accessor ).name;
  var elementName = accessorName + '[' + (elementNumber) + ']';
  this.scopes[this.getCurrentScope()][elementName] = element.id;

  return element;
}

Program.prototype.addArrayElementStep = function (element, value, line) {
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    this.addStep(element.id, 'pointer', value.___id, line);
  } else {
    this.addStep(element.id, 'value', value, line);
  } 
}

module.exports = Program;