var WrappedCodeRunner = require('../WrappedCodeRunner');

module.exports = function (self) {
  self.addEventListener('message',function (message){
    
    var wrappedCode = message.data;

    var data = WrappedCodeRunner(wrappedCode);

    // var ___Program = new Program;
    // ___Program._wrappedCode = wrappedCode;


    // Object.defineProperty(Object.prototype, '___obj', {
    //   value: function () {
    //     ___Program.registerObject(this);
    //     return this;
    //   },
    //   enumerable: false,
    //   writable: true
    // });

    // Object.defineProperty(Function.prototype, '___fn', {
    //   value: function () {
    //     // var id = ___Program.newFunctionId();

    //     ___Program.registerFunction(this);
    //     return this;
    //   },
    //   enumerable: false,
    //   writable: true
    // });



    // // Store built-in methods to track invocation
    // var ___Object = {};
    // ___Object.___constructor = Object.prototype.constructor;

    // var ___Array = {};
    // ___Array.___push = Array.prototype.push;
    // ___Array.___pop = Array.prototype.pop;
    // ___Array.___shift = Array.prototype.shift;
    // ___Array.___unshift = Array.prototype.unshift;
    // ___Array.___slice = Array.prototype.slice;
    // ___Array.___splice = Array.prototype.splice


    // Object.prototype.constructor = function () {
    //   console.log('YEAH');
    //   return this;
    // }

    // Array.prototype.push = function () {
    //   ___Array.___push.apply(this, arguments);
    //   ___Program.nativeArrayPush(this);
    //   return this;
    // }

    // Array.prototype.pop = function () {
    //   var popReturn = ___Array.___pop.apply(this, arguments);
    //   ___Program.nativeArrayPop(this);
    //   return popReturn;
    // }

    // Array.prototype.shift = function () {
    //   var shiftReturn = ___Array.___shift.apply(this, arguments);
    //   ___Program.nativeArrayShift(this);
    //   return shiftReturn;
    // }

    // Array.prototype.unshift = function () {
    //   ___Array.___unshift.apply(this, arguments);
    //   ___Program.nativeArrayUnshift(this);
    //   return this;
    // }

    // Array.prototype.slice = function () {
    //   var sliceReturn = ___Array.___slice.apply(this, arguments);
    //   return sliceReturn.___obj();
    // }

    // Array.prototype.splice = function () {
    //   var spliceReturn = ___Array.___splice.apply(this, arguments);
    //   ___Program.nativeArraySplice(this);
    //   return spliceReturn.___obj();
    // }


    
    // // Evaluate the injected and wrapped code

    // // try {
    // //   eval(wrappedCode);
    // // } catch(e) {
    // //   var err = e.constructor('Error in Wrapped Code: ' + e.message);
    // //   console.log(err.lineNumber, err);
    // // }

    // try {
    //   eval(wrappedCode);
    // } catch (e) {
      
    // }


    // // Reset built-in methods
    // Object.prototype.constructor = ___Object.___constructor;

    // Array.prototype.push = ___Array.___push;
    // Array.prototype.pop = ___Array.___pop;
    // Array.prototype.shift = ___Array.___shift;
    // Array.prototype.unshift = ___Array.___unshift;
    // Array.prototype.slice = ___Array.___slice;
    // Array.prototype.splice = ___Array.___splice;


    postMessage(data);

  });
};