import { gpuUtils } from '../gpu/gpuUtils.js';
import { Math2 } from '../mathUtils/Math2';
import 'regenerator-runtime/runtime' 

let dynamicImport = async (url) => {
  let module = await import(url);
  return module;
}

//Get the text inside of a function (regular or arrow);
function getFunctionBody (methodString) {
  return methodString.toString().replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4');
}

function getFunctionHead (methodString) {
  let fnstring = methodString.toString();
  return fnstring.slice(0,fnstring.indexOf('{') + 1);
}

function buildNewFunction(head, body) {
  let newFunc = eval(head+body+'}');
  return newFunc;
}

function parseFunctionFromText(method){
  //Get the text inside of a function (regular or arrow);
  let getFunctionBody = (methodString) => {
    return methodString.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i, '$2$3$4');
  }

  let getFunctionHead = (methodString) => {
    return methodString.slice(0,methodString.indexOf('{') + 1);
  }

  let newFuncHead = getFunctionHead(method);
  let newFuncBody = getFunctionBody(method);

  let newFunc;
  if (newFuncHead.includes('function ')){
    let varName = newFuncHead.split('(')[1].split(')')[0]
    newFunc = new Function(varName, newFuncBody);
  } else {
    newFunc = eval(newFuncHead+newFuncBody+"}");
  }

  return newFunc;

} 


export class CallbackManager{
    constructor(){

        try {
            window.gpu = new gpuUtils();
            this.gpu = window.gpu;
        } catch {
            let gpu = new gpuUtils();
            this.gpu = gpu;
        }

        this.canvas = new OffscreenCanvas(512,512); //can add fnctions and refer to this.offscreen 
        this.context;
        this.animation = undefined;
        this.animtionFunc = undefined;
        this.animating = false;
        this.threeWorker = undefined;

        this.callbacks = [
          {case:'list',callback:(args)=>{
            let list = [];
            this.callbacks.forEach((obj)=>{
              list.push(obj.case);
            });
            return list;
          }},
          {case:'addfunc',callback:(args)=>{ //arg0 = name, arg1 = function string (arrow or normal)
            let newFunc = parseFunctionFromText(args[1]);
          
            let newCallback = {case:args[0],callback:newFunc};
          
            let found = self.callbacks.findIndex(c => {if (c.case === newCallback.case) return c})
            if (found != -1) self.callbacks[found] = newCallback
            else self.callbacks.push(newCallback);
          }},
          {case:'addgpufunc',callback:(args)=>{ //arg0 = gpu in-thread function string
            this.gpu.addFunction(parseFunctionFromText(args[0]));
          }},
          {case:'addkernel',callback:(args)=>{ //arg0 = kernel name, arg1 = kernel function string
            this.gpu.addKernel(args[0],parseFunctionFromText(args[1]));
          }},
          {case:'callkernel',callback:(args)=>{ //arg0 = kernel name, args.slice(1) = kernel input arguments
            return this.gpu.callKernel(args[0],args.slice(1)); //generalized gpu kernel calls
          }},
          {case:'resizecanvas',callback:(args)=>{
            this.canvas.width = args[0];
            this.canvas.height = args[1];
            return true;
          }},
          {case: 'initThree',callback: async (args) => {
            if(this.animating) {
              this.animating = false;
              cancelAnimationFrame(this.animation);
            }
            if(!this.threeUtil){
              let module = await dynamicImport('./workerThreeUtils.js');
              this.threeUtil = new module.threeUtil(this.canvas);
            }
            if(args[0]) { //first is the setup function
              this.threeUtil.setup = parseFunctionFromText(args[0]);
            }
            if(args[1]) { //next is the draw function (for 1 frame)
              this.threeUtil.draw = parseFunctionFromText(args[1]);
            }
            if(args[2]) {
              this.threeUtil.clear = parseFunctionFromText(args[2]);
            }
            this.threeUtil.setup();
          }},
          {case:'startThree',callback:(args)=>{ //run the setup to start the three animation
            if(this.animating) {
              this.animating = false;
              cancelAnimationFrame(this.animation);
            }
            if(this.threeUtil) {
              this.threeUtil.setup();
            }
          }},
          {case:'clearThree',callback: (args) => { //run the clear function to stop three
            if(this.threeUtil) {
              this.threeUtil.clear();
            }
          }},
          {case:'setValues',callback:(args)=>{
            if(typeof args === 'object') {
              Object.keys(args).forEach((key)=>{
                this[key] = args[key]; //variables will be accessible in functions as this.x or this['x']
                if(this.threeUtil) this.threeUtil[key] = args[key];
              });
              return true;
            } else return false;
          }},
          {case:'setAnimation',callback:(args)=>{ //pass a draw function to be run on an animation loop. Reference this.canvas and this.context or canvas and context. Reference values with this.x etc. and use setValues to set the values from another thread

            this.animationFunc = parseFunctionFromText(args[0]);
            return true;
          }},
          {case:'startAnimation',callback:(args)=>{
            let anim = () => {
              if(this.animating) {
                this.animationFunc();
                requestAnimationFrame(anim);
              }
            }

            if(this.animating) {
              this.animating = false; 
              cancelAnimationFrame(this.animation);
              setTimeout(()=>{
                this.checkCallbacks('setupAnim');
                this.animating = true;
                this.animation = requestAnimationFrame(anim);              
              },300);
            } else { 
              this.checkCallbacks('setupAnim');
              this.animating = true;
              this.animation = requestAnimationFrame(anim);
            }
          }},
          {case:'stopAnimation',callback:(args)=>{
            if(this.animating) {
              this.animating = false;
              cancelAnimationFrame(this.animation);
              return true;
            } else return false;
          }},
          {case:'xcor', callback:(args)=>{return Math2.crosscorrelation(...args);}},
          {case:'autocor', callback:(args)=>{return Math2.autocorrelation(args);}},
          {case:'cov1d', callback:(args)=>{return Math2.cov1d(...args);}},
          {case:'cov2d', callback:(args)=>{return Math2.cov2d(args);}},
          {case:'sma', callback:(args)=>{return Math2.sma(...args);}},
          {case:'dft', callback:(args)=>{
            if(args[2] == undefined) args[2] = 1;
            return this.gpu.gpuDFT(...args);
          }},
          {case:'multidft', callback:(args)=>{
            if(args[2] == undefined) args[2] = 1;
            return this.gpu.MultiChannelDFT(...args);
          }},
          {case:'multidftbandpass', callback:(args)=>{
            if(args[4] == undefined) args[4] = 1;
            return this.gpu.MultiChannelDFT_Bandpass(...args);
          }},
          {case:'fft', callback:(args)=>{ 
            if(args[2] == undefined) args[2] = 1;
            return this.gpu.gpuFFT(...args);
          }},
          {case:'multifft', callback:(args)=>{
            if(args[2] == undefined) args[2] = 1;
            return this.gpu.MultiChannelFFT(...args);
          }},
          {case:'multifftbandpass', callback:(args)=>{
            if(args[4] == undefined) args[4] = 1;
            return this.gpu.MultiChannelFFT_Bandpass(...args);
          }},
          {case:'gpucoh', callback:(args)=>{return this.gpu.gpuCoherence(...args);}},
          {case:'coherence', callback:(args)=>{
            const correlograms = Math2.correlograms(args[0]);
            const buffer = [...args[0],...correlograms];
            var dfts;
        
            var scalar = 1;
            //console.log(mins)
            //console.log(buffer);
            dfts = this.gpu.MultiChannelDFT_Bandpass(buffer, args[1], args[2], args[3], scalar);
            //console.log(dfts)
            const cordfts = dfts[1].splice(args[0].length, buffer.length-args[0].length);
            //console.log(cordfts)
        
            const coherenceResults = [];
            const nChannels = args[0].length;
        
            //cross-correlation dfts arranged like e.g. for 4 channels: [0:0, 0:1, 0:2, 0:3, 1:1, 1:2, 1:3, 2:2, 2:3, 3:3] etc.
            var k=0;
            var l=0;
            cordfts.forEach((row,i) => { //move autocorrelation results to front to save brain power
              if (l+k === nChannels) {
                var temp = cordfts.splice(i,1);
                k++;
                cordfts.splice(k,0,...temp);
                l=0;
                //console.log(i);
              }
              l++;
            });
            //Now arranged like [0:0,1:1,2:2,3:3,0:1,0:2,0:3,1:2,1:3,2:3]
        
            //Outputs FFT coherence data in order of channel data inputted e.g. for 4 channels resulting DFTs = [0:1,0:2,0:3,1:2,1:3,2:3];
        
            var autoFFTproducts = [];
            k = 0;
            l = 1;
            cordfts.forEach((dft,i) => {
              var newdft = new Array(dft.length).fill(0);
              if(i < nChannels) { //sort out autocorrelogram FFTs
                dft.forEach((amp,j) => {
                  newdft[j] = amp//*dfts[1][i][j];
                });
                autoFFTproducts.push(newdft);
              }
              else{ //now multiply cross correlogram ffts and divide by autocorrelogram ffts (magnitude squared coherence)
                dft.forEach((amp,j) => {
                    newdft[j] = amp*amp/(autoFFTproducts[k][j]*autoFFTproducts[k+l][j]);//Magnitude squared coherence;
                    if(newdft[j] > 1) { newdft[j] = 1; } //caps the values at 1
                    //newdft[j] = Math.pow(newdft[j],.125)
                });
                l++;
                if((l+k) === nChannels) {
                  k++;
                  l = 1;
                }
                coherenceResults.push(newdft);
              }
            });
            return [dfts[0], dfts[1], coherenceResults];
          }}
        ];
    }

    checkCallbacks(event) {
      let output = 'function not defined';
      this.callbacks.find((o,i)=>{
        if(o.case === event.data.foo) {
          output = o.callback(event.data.input);
          return true;
        }
      });
      return output;
    }
}