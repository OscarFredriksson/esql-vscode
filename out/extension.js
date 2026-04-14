"use strict";var Fe=Object.create;var M=Object.defineProperty;var Oe=Object.getOwnPropertyDescriptor;var $e=Object.getOwnPropertyNames;var Be=Object.getPrototypeOf,Ve=Object.prototype.hasOwnProperty;var y=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),Re=(t,e)=>{for(var n in e)M(t,n,{get:e[n],enumerable:!0})},J=(t,e,n,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of $e(e))!Ve.call(t,i)&&i!==n&&M(t,i,{get:()=>e[i],enumerable:!(o=Oe(e,i))||o.enumerable});return t};var V=(t,e,n)=>(n=t!=null?Fe(Be(t)):{},J(e||!t||!t.__esModule?M(n,"default",{value:t,enumerable:!0}):n,t)),ze=t=>J(M({},"__esModule",{value:!0}),t);var F=y(N=>{"use strict";var j=":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD",He=j+"\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040",K="["+j+"]["+He+"]*",Ue=new RegExp("^"+K+"$"),_e=function(t,e){let n=[],o=e.exec(t);for(;o;){let i=[];i.startIndex=e.lastIndex-o[0].length;let r=o.length;for(let s=0;s<r;s++)i.push(o[s]);n.push(i),o=e.exec(t)}return n},Ye=function(t){let e=Ue.exec(t);return!(e===null||typeof e>"u")};N.isExist=function(t){return typeof t<"u"};N.isEmptyObject=function(t){return Object.keys(t).length===0};N.merge=function(t,e,n){if(e){let o=Object.keys(e),i=o.length;for(let r=0;r<i;r++)n==="strict"?t[o[r]]=[e[o[r]]]:t[o[r]]=e[o[r]]}};N.getValue=function(t){return N.isExist(t)?t:""};N.isName=Ye;N.getAllMatches=_e;N.nameRegexp=K});var z=y(oe=>{"use strict";var R=F(),Xe={allowBooleanAttributes:!1,unpairedTags:[]};oe.validate=function(t,e){e=Object.assign({},Xe,e);let n=[],o=!1,i=!1;t[0]==="\uFEFF"&&(t=t.substr(1));for(let r=0;r<t.length;r++)if(t[r]==="<"&&t[r+1]==="?"){if(r+=2,r=ee(t,r),r.err)return r}else if(t[r]==="<"){let s=r;if(r++,t[r]==="!"){r=te(t,r);continue}else{let c=!1;t[r]==="/"&&(c=!0,r++);let a="";for(;r<t.length&&t[r]!==">"&&t[r]!==" "&&t[r]!=="	"&&t[r]!==`
`&&t[r]!=="\r";r++)a+=t[r];if(a=a.trim(),a[a.length-1]==="/"&&(a=a.substring(0,a.length-1),r--),!Ke(a)){let d;return a.trim().length===0?d="Invalid space after '<'.":d="Tag '"+a+"' is an invalid name.",g("InvalidTag",d,m(t,r))}let l=Ge(t,r);if(l===!1)return g("InvalidAttr","Attributes for '"+a+"' have open quote.",m(t,r));let u=l.value;if(r=l.index,u[u.length-1]==="/"){let d=r-u.length;u=u.substring(0,u.length-1);let p=ne(u,e);if(p===!0)o=!0;else return g(p.err.code,p.err.msg,m(t,d+p.err.line))}else if(c)if(l.tagClosed){if(u.trim().length>0)return g("InvalidTag","Closing tag '"+a+"' can't have attributes or invalid starting.",m(t,s));if(n.length===0)return g("InvalidTag","Closing tag '"+a+"' has not been opened.",m(t,s));{let d=n.pop();if(a!==d.tagName){let p=m(t,d.tagStartPos);return g("InvalidTag","Expected closing tag '"+d.tagName+"' (opened in line "+p.line+", col "+p.col+") instead of closing tag '"+a+"'.",m(t,s))}n.length==0&&(i=!0)}}else return g("InvalidTag","Closing tag '"+a+"' doesn't have proper closing.",m(t,r));else{let d=ne(u,e);if(d!==!0)return g(d.err.code,d.err.msg,m(t,r-u.length+d.err.line));if(i===!0)return g("InvalidXml","Multiple possible root nodes found.",m(t,r));e.unpairedTags.indexOf(a)!==-1||n.push({tagName:a,tagStartPos:s}),o=!0}for(r++;r<t.length;r++)if(t[r]==="<")if(t[r+1]==="!"){r++,r=te(t,r);continue}else if(t[r+1]==="?"){if(r=ee(t,++r),r.err)return r}else break;else if(t[r]==="&"){let d=Je(t,r);if(d==-1)return g("InvalidChar","char '&' is not expected.",m(t,r));r=d}else if(i===!0&&!D(t[r]))return g("InvalidXml","Extra text at the end",m(t,r));t[r]==="<"&&r--}}else{if(D(t[r]))continue;return g("InvalidChar","char '"+t[r]+"' is not expected.",m(t,r))}if(o){if(n.length==1)return g("InvalidTag","Unclosed tag '"+n[0].tagName+"'.",m(t,n[0].tagStartPos));if(n.length>0)return g("InvalidXml","Invalid '"+JSON.stringify(n.map(r=>r.tagName),null,4).replace(/\r?\n/g,"")+"' found.",{line:1,col:1})}else return g("InvalidXml","Start tag expected.",1);return!0};function D(t){return t===" "||t==="	"||t===`
`||t==="\r"}function ee(t,e){let n=e;for(;e<t.length;e++)if(t[e]=="?"||t[e]==" "){let o=t.substr(n,e-n);if(e>5&&o==="xml")return g("InvalidXml","XML declaration allowed only at the start of the document.",m(t,e));if(t[e]=="?"&&t[e+1]==">"){e++;break}else continue}return e}function te(t,e){if(t.length>e+5&&t[e+1]==="-"&&t[e+2]==="-"){for(e+=3;e<t.length;e++)if(t[e]==="-"&&t[e+1]==="-"&&t[e+2]===">"){e+=2;break}}else if(t.length>e+8&&t[e+1]==="D"&&t[e+2]==="O"&&t[e+3]==="C"&&t[e+4]==="T"&&t[e+5]==="Y"&&t[e+6]==="P"&&t[e+7]==="E"){let n=1;for(e+=8;e<t.length;e++)if(t[e]==="<")n++;else if(t[e]===">"&&(n--,n===0))break}else if(t.length>e+9&&t[e+1]==="["&&t[e+2]==="C"&&t[e+3]==="D"&&t[e+4]==="A"&&t[e+5]==="T"&&t[e+6]==="A"&&t[e+7]==="["){for(e+=8;e<t.length;e++)if(t[e]==="]"&&t[e+1]==="]"&&t[e+2]===">"){e+=2;break}}return e}var qe='"',We="'";function Ge(t,e){let n="",o="",i=!1;for(;e<t.length;e++){if(t[e]===qe||t[e]===We)o===""?o=t[e]:o!==t[e]||(o="");else if(t[e]===">"&&o===""){i=!0;break}n+=t[e]}return o!==""?!1:{value:n,index:e,tagClosed:i}}var Ze=new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`,"g");function ne(t,e){let n=R.getAllMatches(t,Ze),o={};for(let i=0;i<n.length;i++){if(n[i][1].length===0)return g("InvalidAttr","Attribute '"+n[i][2]+"' has no space in starting.",S(n[i]));if(n[i][3]!==void 0&&n[i][4]===void 0)return g("InvalidAttr","Attribute '"+n[i][2]+"' is without value.",S(n[i]));if(n[i][3]===void 0&&!e.allowBooleanAttributes)return g("InvalidAttr","boolean attribute '"+n[i][2]+"' is not allowed.",S(n[i]));let r=n[i][2];if(!je(r))return g("InvalidAttr","Attribute '"+r+"' is an invalid name.",S(n[i]));if(!o.hasOwnProperty(r))o[r]=1;else return g("InvalidAttr","Attribute '"+r+"' is repeated.",S(n[i]))}return!0}function Qe(t,e){let n=/\d/;for(t[e]==="x"&&(e++,n=/[\da-fA-F]/);e<t.length;e++){if(t[e]===";")return e;if(!t[e].match(n))break}return-1}function Je(t,e){if(e++,t[e]===";")return-1;if(t[e]==="#")return e++,Qe(t,e);let n=0;for(;e<t.length;e++,n++)if(!(t[e].match(/\w/)&&n<20)){if(t[e]===";")break;return-1}return e}function g(t,e,n){return{err:{code:t,msg:e,line:n.line||n,col:n.col}}}function je(t){return R.isName(t)}function Ke(t){return R.isName(t)}function m(t,e){let n=t.substring(0,e).split(/\r?\n/);return{line:n.length,col:n[n.length-1].length+1}}function S(t){return t.startIndex+t[1].length}});var se=y(H=>{var ie={preserveOrder:!1,attributeNamePrefix:"@_",attributesGroupName:!1,textNodeName:"#text",ignoreAttributes:!0,removeNSPrefix:!1,allowBooleanAttributes:!1,parseTagValue:!0,parseAttributeValue:!1,trimValues:!0,cdataPropName:!1,numberParseOptions:{hex:!0,leadingZeros:!0,eNotation:!0},tagValueProcessor:function(t,e){return e},attributeValueProcessor:function(t,e){return e},stopNodes:[],alwaysCreateTextNode:!1,isArray:()=>!1,commentPropName:!1,unpairedTags:[],processEntities:!0,htmlEntities:!1,ignoreDeclaration:!1,ignorePiTags:!1,transformTagName:!1,transformAttributeName:!1,updateTag:function(t,e,n){return t},captureMetaData:!1,maxNestedTags:100,strictReservedNames:!0};function re(t){return typeof t=="boolean"?{enabled:t,maxEntitySize:1e4,maxExpansionDepth:10,maxTotalExpansions:1e3,maxExpandedLength:1e5,allowedTags:null,tagFilter:null}:typeof t=="object"&&t!==null?{enabled:t.enabled!==!1,maxEntitySize:t.maxEntitySize??1e4,maxExpansionDepth:t.maxExpansionDepth??10,maxTotalExpansions:t.maxTotalExpansions??1e3,maxExpandedLength:t.maxExpandedLength??1e5,allowedTags:t.allowedTags??null,tagFilter:t.tagFilter??null}:re(!0)}var De=function(t){let e=Object.assign({},ie,t);return e.processEntities=re(e.processEntities),e};H.buildOptions=De;H.defaultOptions=ie});var le=y((Jt,ae)=>{"use strict";var U=class{constructor(e){this.tagname=e,this.child=[],this[":@"]={}}add(e,n){e==="__proto__"&&(e="#__proto__"),this.child.push({[e]:n})}addChild(e){e.tagname==="__proto__"&&(e.tagname="#__proto__"),e[":@"]&&Object.keys(e[":@"]).length>0?this.child.push({[e.tagname]:e.child,":@":e[":@"]}):this.child.push({[e.tagname]:e.child})}};ae.exports=U});var ue=y((jt,de)=>{var ce=F(),_=class{constructor(e){this.suppressValidationErr=!e,this.options=e||{}}readDocType(e,n){let o=Object.create(null);if(e[n+3]==="O"&&e[n+4]==="C"&&e[n+5]==="T"&&e[n+6]==="Y"&&e[n+7]==="P"&&e[n+8]==="E"){n=n+9;let i=1,r=!1,s=!1,c="";for(;n<e.length;n++)if(e[n]==="<"&&!s){if(r&&E(e,"!ENTITY",n)){n+=7;let a,l;if([a,l,n]=this.readEntityExp(e,n+1,this.suppressValidationErr),l.indexOf("&")===-1){let u=a.replace(/[.\-+*:]/g,"\\.");o[a]={regx:RegExp(`&${u};`,"g"),val:l}}}else if(r&&E(e,"!ELEMENT",n)){n+=8;let{index:a}=this.readElementExp(e,n+1);n=a}else if(r&&E(e,"!ATTLIST",n))n+=8;else if(r&&E(e,"!NOTATION",n)){n+=9;let{index:a}=this.readNotationExp(e,n+1,this.suppressValidationErr);n=a}else if(E(e,"!--",n))s=!0;else throw new Error("Invalid DOCTYPE");i++,c=""}else if(e[n]===">"){if(s?e[n-1]==="-"&&e[n-2]==="-"&&(s=!1,i--):i--,i===0)break}else e[n]==="["?r=!0:c+=e[n];if(i!==0)throw new Error("Unclosed DOCTYPE")}else throw new Error("Invalid Tag instead of DOCTYPE");return{entities:o,i:n}}readEntityExp(e,n){n=b(e,n);let o="";for(;n<e.length&&!/\s/.test(e[n])&&e[n]!=='"'&&e[n]!=="'";)o+=e[n],n++;if(L(o),n=b(e,n),!this.suppressValidationErr){if(e.substring(n,n+6).toUpperCase()==="SYSTEM")throw new Error("External entities are not supported");if(e[n]==="%")throw new Error("Parameter entities are not supported")}let i="";if([n,i]=this.readIdentifierVal(e,n,"entity"),this.options.enabled!==!1&&this.options.maxEntitySize&&i.length>this.options.maxEntitySize)throw new Error(`Entity "${o}" size (${i.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`);return n--,[o,i,n]}readNotationExp(e,n){n=b(e,n);let o="";for(;n<e.length&&!/\s/.test(e[n]);)o+=e[n],n++;!this.suppressValidationErr&&L(o),n=b(e,n);let i=e.substring(n,n+6).toUpperCase();if(!this.suppressValidationErr&&i!=="SYSTEM"&&i!=="PUBLIC")throw new Error(`Expected SYSTEM or PUBLIC, found "${i}"`);n+=i.length,n=b(e,n);let r=null,s=null;if(i==="PUBLIC")[n,r]=this.readIdentifierVal(e,n,"publicIdentifier"),n=b(e,n),(e[n]==='"'||e[n]==="'")&&([n,s]=this.readIdentifierVal(e,n,"systemIdentifier"));else if(i==="SYSTEM"&&([n,s]=this.readIdentifierVal(e,n,"systemIdentifier"),!this.suppressValidationErr&&!s))throw new Error("Missing mandatory system identifier for SYSTEM notation");return{notationName:o,publicIdentifier:r,systemIdentifier:s,index:--n}}readIdentifierVal(e,n,o){let i="",r=e[n];if(r!=='"'&&r!=="'")throw new Error(`Expected quoted string, found "${r}"`);for(n++;n<e.length&&e[n]!==r;)i+=e[n],n++;if(e[n]!==r)throw new Error(`Unterminated ${o} value`);return n++,[n,i]}readElementExp(e,n){n=b(e,n);let o="";for(;n<e.length&&!/\s/.test(e[n]);)o+=e[n],n++;if(!this.suppressValidationErr&&!ce.isName(o))throw new Error(`Invalid element name: "${o}"`);n=b(e,n);let i="";if(e[n]==="E"&&E(e,"MPTY",n))n+=4;else if(e[n]==="A"&&E(e,"NY",n))n+=2;else if(e[n]==="("){for(n++;n<e.length&&e[n]!==")";)i+=e[n],n++;if(e[n]!==")")throw new Error("Unterminated content model")}else if(!this.suppressValidationErr)throw new Error(`Invalid Element Expression, found "${e[n]}"`);return{elementName:o,contentModel:i.trim(),index:n}}readAttlistExp(e,n){n=b(e,n);let o="";for(;n<e.length&&!/\s/.test(e[n]);)o+=e[n],n++;L(o),n=b(e,n);let i="";for(;n<e.length&&!/\s/.test(e[n]);)i+=e[n],n++;if(!L(i))throw new Error(`Invalid attribute name: "${i}"`);n=b(e,n);let r="";if(e.substring(n,n+8).toUpperCase()==="NOTATION"){if(r="NOTATION",n+=8,n=b(e,n),e[n]!=="(")throw new Error(`Expected '(', found "${e[n]}"`);n++;let c=[];for(;n<e.length&&e[n]!==")";){let a="";for(;n<e.length&&e[n]!=="|"&&e[n]!==")";)a+=e[n],n++;if(a=a.trim(),!L(a))throw new Error(`Invalid notation name: "${a}"`);c.push(a),e[n]==="|"&&(n++,n=b(e,n))}if(e[n]!==")")throw new Error("Unterminated list of notations");n++,r+=" ("+c.join("|")+")"}else{for(;n<e.length&&!/\s/.test(e[n]);)r+=e[n],n++;let c=["CDATA","ID","IDREF","IDREFS","ENTITY","ENTITIES","NMTOKEN","NMTOKENS"];if(!this.suppressValidationErr&&!c.includes(r.toUpperCase()))throw new Error(`Invalid attribute type: "${r}"`)}n=b(e,n);let s="";return e.substring(n,n+8).toUpperCase()==="#REQUIRED"?(s="#REQUIRED",n+=8):e.substring(n,n+7).toUpperCase()==="#IMPLIED"?(s="#IMPLIED",n+=7):[n,s]=this.readIdentifierVal(e,n,"ATTLIST"),{elementName:o,attributeName:i,attributeType:r,defaultValue:s,index:n}}},b=(t,e)=>{for(;e<t.length&&/\s/.test(t[e]);)e++;return e};function E(t,e,n){for(let o=0;o<e.length;o++)if(e[o]!==t[n+o+1])return!1;return!0}function L(t){if(ce.isName(t))return t;throw new Error(`Invalid entity name ${t}`)}de.exports=_});var fe=y((Kt,pe)=>{var et=/^[-+]?0x[a-fA-F0-9]+$/,tt=/^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/,nt={hex:!0,leadingZeros:!0,decimalPoint:".",eNotation:!0};function ot(t,e={}){if(e=Object.assign({},nt,e),!t||typeof t!="string")return t;let n=t.trim();if(e.skipLike!==void 0&&e.skipLike.test(n))return t;if(t==="0")return 0;if(e.hex&&et.test(n))return rt(n,16);if(n.search(/[eE]/)!==-1){let o=n.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);if(o){if(e.leadingZeros)n=(o[1]||"")+o[3];else if(!(o[2]==="0"&&o[3][0]==="."))return t;return e.eNotation?Number(n):t}else return t}else{let o=tt.exec(n);if(o){let i=o[1],r=o[2],s=it(o[3]);if(!e.leadingZeros&&r.length>0&&i&&n[2]!==".")return t;if(!e.leadingZeros&&r.length>0&&!i&&n[1]!==".")return t;if(e.leadingZeros&&r===t)return 0;{let c=Number(n),a=""+c;return a.search(/[eE]/)!==-1?e.eNotation?c:t:n.indexOf(".")!==-1?a==="0"&&s===""||a===s||i&&a==="-"+s?c:t:r?s===a||i+s===a?c:t:n===a||n===i+a?c:t}}else return t}}function it(t){return t&&t.indexOf(".")!==-1&&(t=t.replace(/0+$/,""),t==="."?t="0":t[0]==="."?t="0"+t:t[t.length-1]==="."&&(t=t.substr(0,t.length-1))),t}function rt(t,e){if(parseInt)return parseInt(t,e);if(Number.parseInt)return Number.parseInt(t,e);if(window&&window.parseInt)return window.parseInt(t,e);throw new Error("parseInt, Number.parseInt, window.parseInt are not supported")}pe.exports=ot});var Y=y((Dt,he)=>{function st(t){return typeof t=="function"?t:Array.isArray(t)?e=>{for(let n of t)if(typeof n=="string"&&e===n||n instanceof RegExp&&n.test(e))return!0}:()=>!1}he.exports=st});var we=y((en,be)=>{"use strict";var me=F(),k=le(),at=ue(),lt=fe(),ct=Y(),X=class{constructor(e){if(this.options=e,this.currentNode=null,this.tagsNodeStack=[],this.docTypeEntities={},this.lastEntities={apos:{regex:/&(apos|#39|#x27);/g,val:"'"},gt:{regex:/&(gt|#62|#x3E);/g,val:">"},lt:{regex:/&(lt|#60|#x3C);/g,val:"<"},quot:{regex:/&(quot|#34|#x22);/g,val:'"'}},this.ampEntity={regex:/&(amp|#38|#x26);/g,val:"&"},this.htmlEntities={space:{regex:/&(nbsp|#160);/g,val:" "},cent:{regex:/&(cent|#162);/g,val:"\xA2"},pound:{regex:/&(pound|#163);/g,val:"\xA3"},yen:{regex:/&(yen|#165);/g,val:"\xA5"},euro:{regex:/&(euro|#8364);/g,val:"\u20AC"},copyright:{regex:/&(copy|#169);/g,val:"\xA9"},reg:{regex:/&(reg|#174);/g,val:"\xAE"},inr:{regex:/&(inr|#8377);/g,val:"\u20B9"},num_dec:{regex:/&#([0-9]{1,7});/g,val:(n,o)=>ge(o,10,"&#")},num_hex:{regex:/&#x([0-9a-fA-F]{1,6});/g,val:(n,o)=>ge(o,16,"&#x")}},this.addExternalEntities=dt,this.parseXml=gt,this.parseTextData=ut,this.resolveNameSpace=pt,this.buildAttributesMap=ht,this.isItStopNode=vt,this.replaceEntitiesValue=bt,this.readStopNodeData=xt,this.saveTextToParentTag=wt,this.addChild=mt,this.ignoreAttributesFn=ct(this.options.ignoreAttributes),this.entityExpansionCount=0,this.currentExpandedLength=0,this.options.stopNodes&&this.options.stopNodes.length>0){this.stopNodesExact=new Set,this.stopNodesWildcard=new Set;for(let n=0;n<this.options.stopNodes.length;n++){let o=this.options.stopNodes[n];typeof o=="string"&&(o.startsWith("*.")?this.stopNodesWildcard.add(o.substring(2)):this.stopNodesExact.add(o))}}}};function dt(t){let e=Object.keys(t);for(let n=0;n<e.length;n++){let o=e[n],i=o.replace(/[.\-+*:]/g,"\\.");this.lastEntities[o]={regex:new RegExp("&"+i+";","g"),val:t[o]}}}function ut(t,e,n,o,i,r,s){if(t!==void 0&&(this.options.trimValues&&!o&&(t=t.trim()),t.length>0)){s||(t=this.replaceEntitiesValue(t,e,n));let c=this.options.tagValueProcessor(e,t,n,i,r);return c==null?t:typeof c!=typeof t||c!==t?c:this.options.trimValues?W(t,this.options.parseTagValue,this.options.numberParseOptions):t.trim()===t?W(t,this.options.parseTagValue,this.options.numberParseOptions):t}}function pt(t){if(this.options.removeNSPrefix){let e=t.split(":"),n=t.charAt(0)==="/"?"/":"";if(e[0]==="xmlns")return"";e.length===2&&(t=n+e[1])}return t}var ft=new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`,"gm");function ht(t,e,n){if(this.options.ignoreAttributes!==!0&&typeof t=="string"){let o=me.getAllMatches(t,ft),i=o.length,r={};for(let s=0;s<i;s++){let c=this.resolveNameSpace(o[s][1]);if(this.ignoreAttributesFn(c,e))continue;let a=o[s][4],l=this.options.attributeNamePrefix+c;if(c.length)if(this.options.transformAttributeName&&(l=this.options.transformAttributeName(l)),l==="__proto__"&&(l="#__proto__"),a!==void 0){this.options.trimValues&&(a=a.trim()),a=this.replaceEntitiesValue(a,n,e);let u=this.options.attributeValueProcessor(c,a,e);u==null?r[l]=a:typeof u!=typeof a||u!==a?r[l]=u:r[l]=W(a,this.options.parseAttributeValue,this.options.numberParseOptions)}else this.options.allowBooleanAttributes&&(r[l]=!0)}if(!Object.keys(r).length)return;if(this.options.attributesGroupName){let s={};return s[this.options.attributesGroupName]=r,s}return r}}var gt=function(t){t=t.replace(/\r\n?/g,`
`);let e=new k("!xml"),n=e,o="",i="";this.entityExpansionCount=0,this.currentExpandedLength=0;let r=new at(this.options.processEntities);for(let s=0;s<t.length;s++)if(t[s]==="<")if(t[s+1]==="/"){let a=C(t,">",s,"Closing Tag is not closed."),l=t.substring(s+2,a).trim();if(this.options.removeNSPrefix){let p=l.indexOf(":");p!==-1&&(l=l.substr(p+1))}this.options.transformTagName&&(l=this.options.transformTagName(l)),n&&(o=this.saveTextToParentTag(o,n,i));let u=i.substring(i.lastIndexOf(".")+1);if(l&&this.options.unpairedTags.indexOf(l)!==-1)throw new Error(`Unpaired tag can not be used as closing tag: </${l}>`);let d=0;u&&this.options.unpairedTags.indexOf(u)!==-1?(d=i.lastIndexOf(".",i.lastIndexOf(".")-1),this.tagsNodeStack.pop()):d=i.lastIndexOf("."),i=i.substring(0,d),n=this.tagsNodeStack.pop(),o="",s=a}else if(t[s+1]==="?"){let a=q(t,s,!1,"?>");if(!a)throw new Error("Pi Tag is not closed.");if(o=this.saveTextToParentTag(o,n,i),!(this.options.ignoreDeclaration&&a.tagName==="?xml"||this.options.ignorePiTags)){let l=new k(a.tagName);l.add(this.options.textNodeName,""),a.tagName!==a.tagExp&&a.attrExpPresent&&(l[":@"]=this.buildAttributesMap(a.tagExp,i,a.tagName)),this.addChild(n,l,i,s)}s=a.closeIndex+1}else if(t.substr(s+1,3)==="!--"){let a=C(t,"-->",s+4,"Comment is not closed.");if(this.options.commentPropName){let l=t.substring(s+4,a-2);o=this.saveTextToParentTag(o,n,i),n.add(this.options.commentPropName,[{[this.options.textNodeName]:l}])}s=a}else if(t.substr(s+1,2)==="!D"){let a=r.readDocType(t,s);this.docTypeEntities=a.entities,s=a.i}else if(t.substr(s+1,2)==="!["){let a=C(t,"]]>",s,"CDATA is not closed.")-2,l=t.substring(s+9,a);o=this.saveTextToParentTag(o,n,i);let u=this.parseTextData(l,n.tagname,i,!0,!1,!0,!0);u==null&&(u=""),this.options.cdataPropName?n.add(this.options.cdataPropName,[{[this.options.textNodeName]:l}]):n.add(this.options.textNodeName,u),s=a+2}else{let a=q(t,s,this.options.removeNSPrefix),l=a.tagName,u=a.rawTagName,d=a.tagExp,p=a.attrExpPresent,v=a.closeIndex;if(this.options.transformTagName){let h=this.options.transformTagName(l);d===l&&(d=h),l=h}if(this.options.strictReservedNames&&(l===this.options.commentPropName||l===this.options.cdataPropName))throw new Error(`Invalid tag name: ${l}`);n&&o&&n.tagname!=="!xml"&&(o=this.saveTextToParentTag(o,n,i,!1));let x=n;x&&this.options.unpairedTags.indexOf(x.tagname)!==-1&&(n=this.tagsNodeStack.pop(),i=i.substring(0,i.lastIndexOf("."))),l!==e.tagname&&(i+=i?"."+l:l);let A=s;if(this.isItStopNode(this.stopNodesExact,this.stopNodesWildcard,i,l)){let h="";if(d.length>0&&d.lastIndexOf("/")===d.length-1)l[l.length-1]==="/"?(l=l.substr(0,l.length-1),i=i.substr(0,i.length-1),d=l):d=d.substr(0,d.length-1),s=a.closeIndex;else if(this.options.unpairedTags.indexOf(l)!==-1)s=a.closeIndex;else{let B=this.readStopNodeData(t,u,v+1);if(!B)throw new Error(`Unexpected end of ${u}`);s=B.i,h=B.tagContent}let P=new k(l);l!==d&&p&&(P[":@"]=this.buildAttributesMap(d,i,l)),h&&(h=this.parseTextData(h,l,i,!0,p,!0,!0)),i=i.substr(0,i.lastIndexOf(".")),P.add(this.options.textNodeName,h),this.addChild(n,P,i,A)}else{if(d.length>0&&d.lastIndexOf("/")===d.length-1){if(l[l.length-1]==="/"?(l=l.substr(0,l.length-1),i=i.substr(0,i.length-1),d=l):d=d.substr(0,d.length-1),this.options.transformTagName){let P=this.options.transformTagName(l);d===l&&(d=P),l=P}let h=new k(l);l!==d&&p&&(h[":@"]=this.buildAttributesMap(d,i,l)),this.addChild(n,h,i,A),i=i.substr(0,i.lastIndexOf("."))}else if(this.options.unpairedTags.indexOf(l)!==-1){let h=new k(l);l!==d&&p&&(h[":@"]=this.buildAttributesMap(d,i)),this.addChild(n,h,i,A),i=i.substr(0,i.lastIndexOf(".")),s=a.closeIndex;continue}else{let h=new k(l);if(this.tagsNodeStack.length>this.options.maxNestedTags)throw new Error("Maximum nested tags exceeded");this.tagsNodeStack.push(n),l!==d&&p&&(h[":@"]=this.buildAttributesMap(d,i,l)),this.addChild(n,h,i),n=h}o="",s=v}}else o+=t[s];return e.child};function mt(t,e,n,o){this.options.captureMetaData||(o=void 0);let i=this.options.updateTag(e.tagname,n,e[":@"]);i===!1||(typeof i=="string"&&(e.tagname=i),t.addChild(e,o))}var bt=function(t,e,n){if(t.indexOf("&")===-1)return t;let o=this.options.processEntities;if(!o.enabled||o.allowedTags&&!o.allowedTags.includes(e)||o.tagFilter&&!o.tagFilter(e,n))return t;for(let i in this.docTypeEntities){let r=this.docTypeEntities[i],s=t.match(r.regx);if(s){if(this.entityExpansionCount+=s.length,o.maxTotalExpansions&&this.entityExpansionCount>o.maxTotalExpansions)throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${o.maxTotalExpansions}`);let c=t.length;if(t=t.replace(r.regx,r.val),o.maxExpandedLength&&(this.currentExpandedLength+=t.length-c,this.currentExpandedLength>o.maxExpandedLength))throw new Error(`Total expanded content size exceeded: ${this.currentExpandedLength} > ${o.maxExpandedLength}`)}}if(t.indexOf("&")===-1)return t;for(let i in this.lastEntities){let r=this.lastEntities[i];t=t.replace(r.regex,r.val)}if(t.indexOf("&")===-1)return t;if(this.options.htmlEntities)for(let i in this.htmlEntities){let r=this.htmlEntities[i];t=t.replace(r.regex,r.val)}return t=t.replace(this.ampEntity.regex,this.ampEntity.val),t};function wt(t,e,n,o){return t&&(o===void 0&&(o=e.child.length===0),t=this.parseTextData(t,e.tagname,n,!1,e[":@"]?Object.keys(e[":@"]).length!==0:!1,o),t!==void 0&&t!==""&&e.add(this.options.textNodeName,t),t=""),t}function vt(t,e,n,o){return!!(e&&e.has(o)||t&&t.has(n))}function yt(t,e,n=">"){let o,i="";for(let r=e;r<t.length;r++){let s=t[r];if(o)s===o&&(o="");else if(s==='"'||s==="'")o=s;else if(s===n[0])if(n[1]){if(t[r+1]===n[1])return{data:i,index:r}}else return{data:i,index:r};else s==="	"&&(s=" ");i+=s}}function C(t,e,n,o){let i=t.indexOf(e,n);if(i===-1)throw new Error(o);return i+e.length-1}function q(t,e,n,o=">"){let i=yt(t,e+1,o);if(!i)return;let r=i.data,s=i.index,c=r.search(/\s/),a=r,l=!0;c!==-1&&(a=r.substring(0,c),r=r.substring(c+1).trimStart());let u=a;if(n){let d=a.indexOf(":");d!==-1&&(a=a.substr(d+1),l=a!==i.data.substr(d+1))}return{tagName:a,tagExp:r,closeIndex:s,attrExpPresent:l,rawTagName:u}}function xt(t,e,n){let o=n,i=1;for(;n<t.length;n++)if(t[n]==="<")if(t[n+1]==="/"){let r=C(t,">",n,`${e} is not closed`);if(t.substring(n+2,r).trim()===e&&(i--,i===0))return{tagContent:t.substring(o,n),i:r};n=r}else if(t[n+1]==="?")n=C(t,"?>",n+1,"StopNode is not closed.");else if(t.substr(n+1,3)==="!--")n=C(t,"-->",n+3,"StopNode is not closed.");else if(t.substr(n+1,2)==="![")n=C(t,"]]>",n,"StopNode is not closed.")-2;else{let r=q(t,n,">");r&&((r&&r.tagName)===e&&r.tagExp[r.tagExp.length-1]!=="/"&&i++,n=r.closeIndex)}}function W(t,e,n){if(e&&typeof t=="string"){let o=t.trim();return o==="true"?!0:o==="false"?!1:lt(t,n)}else return me.isExist(t)?t:""}function ge(t,e,n){let o=Number.parseInt(t,e);return o>=0&&o<=1114111?String.fromCodePoint(o):n+t+";"}be.exports=X});var xe=y(ye=>{"use strict";function Nt(t,e){return ve(t,e)}function ve(t,e,n){let o,i={};for(let r=0;r<t.length;r++){let s=t[r],c=Tt(s),a="";if(n===void 0?a=c:a=n+"."+c,c===e.textNodeName)o===void 0?o=s[c]:o+=""+s[c];else{if(c===void 0)continue;if(s[c]){let l=ve(s[c],e,a),u=Ct(l,e);s[":@"]?Et(l,s[":@"],a,e):Object.keys(l).length===1&&l[e.textNodeName]!==void 0&&!e.alwaysCreateTextNode?l=l[e.textNodeName]:Object.keys(l).length===0&&(e.alwaysCreateTextNode?l[e.textNodeName]="":l=""),i[c]!==void 0&&i.hasOwnProperty(c)?(Array.isArray(i[c])||(i[c]=[i[c]]),i[c].push(l)):e.isArray(c,a,u)?i[c]=[l]:i[c]=l}}}return typeof o=="string"?o.length>0&&(i[e.textNodeName]=o):o!==void 0&&(i[e.textNodeName]=o),i}function Tt(t){let e=Object.keys(t);for(let n=0;n<e.length;n++){let o=e[n];if(o!==":@")return o}}function Et(t,e,n,o){if(e){let i=Object.keys(e),r=i.length;for(let s=0;s<r;s++){let c=i[s];o.isArray(c,n+"."+c,!0,!0)?t[c]=[e[c]]:t[c]=e[c]}}}function Ct(t,e){let{textNodeName:n}=e,o=Object.keys(t).length;return!!(o===0||o===1&&(t[n]||typeof t[n]=="boolean"||t[n]===0))}ye.prettify=Nt});var Te=y((nn,Ne)=>{var{buildOptions:It}=se(),Pt=we(),{prettify:kt}=xe(),At=z(),G=class{constructor(e){this.externalEntities={},this.options=It(e)}parse(e,n){if(typeof e!="string")if(e.toString)e=e.toString();else throw new Error("XML data is accepted in String or Bytes[] form.");if(n){n===!0&&(n={});let r=At.validate(e,n);if(r!==!0)throw Error(`${r.err.msg}:${r.err.line}:${r.err.col}`)}let o=new Pt(this.options);o.addExternalEntities(this.externalEntities);let i=o.parseXml(e);return this.options.preserveOrder||i===void 0?i:kt(i,this.options)}addEntity(e,n){if(n.indexOf("&")!==-1)throw new Error("Entity value can't have '&'");if(e.indexOf("&")!==-1||e.indexOf(";")!==-1)throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");if(n==="&")throw new Error("An entity with value '&' is not permitted");this.externalEntities[e]=n}};Ne.exports=G});var Pe=y((on,Ie)=>{var St=`
`;function Lt(t,e){let n="";return e.format&&e.indentBy.length>0&&(n=St),Ce(t,e,"",n)}function Ce(t,e,n,o){let i="",r=!1;if(!Array.isArray(t)){if(t!=null){let s=t.toString();return s=Z(s,e),s}return""}for(let s=0;s<t.length;s++){let c=t[s],a=Mt(c);if(a===void 0)continue;let l="";if(n.length===0?l=a:l=`${n}.${a}`,a===e.textNodeName){let x=c[a];Ft(l,e)||(x=e.tagValueProcessor(a,x),x=Z(x,e)),r&&(i+=o),i+=x,r=!1;continue}else if(a===e.cdataPropName){r&&(i+=o),i+=`<![CDATA[${c[a][0][e.textNodeName]}]]>`,r=!1;continue}else if(a===e.commentPropName){i+=o+`<!--${c[a][0][e.textNodeName]}-->`,r=!0;continue}else if(a[0]==="?"){let x=Ee(c[":@"],e),A=a==="?xml"?"":o,h=c[a][0][e.textNodeName];h=h.length!==0?" "+h:"",i+=A+`<${a}${h}${x}?>`,r=!0;continue}let u=o;u!==""&&(u+=e.indentBy);let d=Ee(c[":@"],e),p=o+`<${a}${d}`,v=Ce(c[a],e,l,u);e.unpairedTags.indexOf(a)!==-1?e.suppressUnpairedNode?i+=p+">":i+=p+"/>":(!v||v.length===0)&&e.suppressEmptyNode?i+=p+"/>":v&&v.endsWith(">")?i+=p+`>${v}${o}</${a}>`:(i+=p+">",v&&o!==""&&(v.includes("/>")||v.includes("</"))?i+=o+e.indentBy+v+o:i+=v,i+=`</${a}>`),r=!0}return i}function Mt(t){let e=Object.keys(t);for(let n=0;n<e.length;n++){let o=e[n];if(Object.prototype.hasOwnProperty.call(t,o)&&o!==":@")return o}}function Ee(t,e){let n="";if(t&&!e.ignoreAttributes)for(let o in t){if(!Object.prototype.hasOwnProperty.call(t,o))continue;let i=e.attributeValueProcessor(o,t[o]);i=Z(i,e),i===!0&&e.suppressBooleanAttributes?n+=` ${o.substr(e.attributeNamePrefix.length)}`:n+=` ${o.substr(e.attributeNamePrefix.length)}="${i}"`}return n}function Ft(t,e){t=t.substr(0,t.length-e.textNodeName.length-1);let n=t.substr(t.lastIndexOf(".")+1);for(let o in e.stopNodes)if(e.stopNodes[o]===t||e.stopNodes[o]==="*."+n)return!0;return!1}function Z(t,e){if(t&&t.length>0&&e.processEntities)for(let n=0;n<e.entities.length;n++){let o=e.entities[n];t=t.replace(o.regex,o.val)}return t}Ie.exports=Lt});var Ae=y((rn,ke)=>{"use strict";var Ot=Pe(),$t=Y(),Bt={attributeNamePrefix:"@_",attributesGroupName:!1,textNodeName:"#text",ignoreAttributes:!0,cdataPropName:!1,format:!1,indentBy:"  ",suppressEmptyNode:!1,suppressUnpairedNode:!0,suppressBooleanAttributes:!0,tagValueProcessor:function(t,e){return e},attributeValueProcessor:function(t,e){return e},preserveOrder:!1,commentPropName:!1,unpairedTags:[],entities:[{regex:new RegExp("&","g"),val:"&amp;"},{regex:new RegExp(">","g"),val:"&gt;"},{regex:new RegExp("<","g"),val:"&lt;"},{regex:new RegExp("'","g"),val:"&apos;"},{regex:new RegExp('"',"g"),val:"&quot;"}],processEntities:!0,stopNodes:[],oneListGroup:!1};function T(t){this.options=Object.assign({},Bt,t),this.options.ignoreAttributes===!0||this.options.attributesGroupName?this.isAttribute=function(){return!1}:(this.ignoreAttributesFn=$t(this.options.ignoreAttributes),this.attrPrefixLen=this.options.attributeNamePrefix.length,this.isAttribute=zt),this.processTextOrObjNode=Vt,this.options.format?(this.indentate=Rt,this.tagEndChar=`>
`,this.newLine=`
`):(this.indentate=function(){return""},this.tagEndChar=">",this.newLine="")}T.prototype.build=function(t){return this.options.preserveOrder?Ot(t,this.options):(Array.isArray(t)&&this.options.arrayNodeName&&this.options.arrayNodeName.length>1&&(t={[this.options.arrayNodeName]:t}),this.j2x(t,0,[]).val)};T.prototype.j2x=function(t,e,n){let o="",i="",r=n.join(".");for(let s in t)if(Object.prototype.hasOwnProperty.call(t,s))if(typeof t[s]>"u")this.isAttribute(s)&&(i+="");else if(t[s]===null)this.isAttribute(s)||s===this.options.cdataPropName?i+="":s[0]==="?"?i+=this.indentate(e)+"<"+s+"?"+this.tagEndChar:i+=this.indentate(e)+"<"+s+"/"+this.tagEndChar;else if(t[s]instanceof Date)i+=this.buildTextValNode(t[s],s,"",e);else if(typeof t[s]!="object"){let c=this.isAttribute(s);if(c&&!this.ignoreAttributesFn(c,r))o+=this.buildAttrPairStr(c,""+t[s]);else if(!c)if(s===this.options.textNodeName){let a=this.options.tagValueProcessor(s,""+t[s]);i+=this.replaceEntitiesValue(a)}else i+=this.buildTextValNode(t[s],s,"",e)}else if(Array.isArray(t[s])){let c=t[s].length,a="",l="";for(let u=0;u<c;u++){let d=t[s][u];if(!(typeof d>"u"))if(d===null)s[0]==="?"?i+=this.indentate(e)+"<"+s+"?"+this.tagEndChar:i+=this.indentate(e)+"<"+s+"/"+this.tagEndChar;else if(typeof d=="object")if(this.options.oneListGroup){let p=this.j2x(d,e+1,n.concat(s));a+=p.val,this.options.attributesGroupName&&d.hasOwnProperty(this.options.attributesGroupName)&&(l+=p.attrStr)}else a+=this.processTextOrObjNode(d,s,e,n);else if(this.options.oneListGroup){let p=this.options.tagValueProcessor(s,d);p=this.replaceEntitiesValue(p),a+=p}else a+=this.buildTextValNode(d,s,"",e)}this.options.oneListGroup&&(a=this.buildObjectNode(a,s,l,e)),i+=a}else if(this.options.attributesGroupName&&s===this.options.attributesGroupName){let c=Object.keys(t[s]),a=c.length;for(let l=0;l<a;l++)o+=this.buildAttrPairStr(c[l],""+t[s][c[l]])}else i+=this.processTextOrObjNode(t[s],s,e,n);return{attrStr:o,val:i}};T.prototype.buildAttrPairStr=function(t,e){return e=this.options.attributeValueProcessor(t,""+e),e=this.replaceEntitiesValue(e),this.options.suppressBooleanAttributes&&e==="true"?" "+t:" "+t+'="'+e+'"'};function Vt(t,e,n,o){let i=this.j2x(t,n+1,o.concat(e));return t[this.options.textNodeName]!==void 0&&Object.keys(t).length===1?this.buildTextValNode(t[this.options.textNodeName],e,i.attrStr,n):this.buildObjectNode(i.val,e,i.attrStr,n)}T.prototype.buildObjectNode=function(t,e,n,o){if(t==="")return e[0]==="?"?this.indentate(o)+"<"+e+n+"?"+this.tagEndChar:this.indentate(o)+"<"+e+n+this.closeTag(e)+this.tagEndChar;{let i="</"+e+this.tagEndChar,r="";return e[0]==="?"&&(r="?",i=""),(n||n==="")&&t.indexOf("<")===-1?this.indentate(o)+"<"+e+n+r+">"+t+i:this.options.commentPropName!==!1&&e===this.options.commentPropName&&r.length===0?this.indentate(o)+`<!--${t}-->`+this.newLine:this.indentate(o)+"<"+e+n+r+this.tagEndChar+t+this.indentate(o)+i}};T.prototype.closeTag=function(t){let e="";return this.options.unpairedTags.indexOf(t)!==-1?this.options.suppressUnpairedNode||(e="/"):this.options.suppressEmptyNode?e="/":e=`></${t}`,e};T.prototype.buildTextValNode=function(t,e,n,o){if(this.options.cdataPropName!==!1&&e===this.options.cdataPropName)return this.indentate(o)+`<![CDATA[${t}]]>`+this.newLine;if(this.options.commentPropName!==!1&&e===this.options.commentPropName)return this.indentate(o)+`<!--${t}-->`+this.newLine;if(e[0]==="?")return this.indentate(o)+"<"+e+n+"?"+this.tagEndChar;{let i=this.options.tagValueProcessor(e,t);return i=this.replaceEntitiesValue(i),i===""?this.indentate(o)+"<"+e+n+this.closeTag(e)+this.tagEndChar:this.indentate(o)+"<"+e+n+">"+i+"</"+e+this.tagEndChar}};T.prototype.replaceEntitiesValue=function(t){if(t&&t.length>0&&this.options.processEntities)for(let e=0;e<this.options.entities.length;e++){let n=this.options.entities[e];t=t.replace(n.regex,n.val)}return t};function Rt(t){return this.options.indentBy.repeat(t)}function zt(t){return t.startsWith(this.options.attributeNamePrefix)&&t!==this.options.textNodeName?t.substr(this.attrPrefixLen):!1}ke.exports=T});var Le=y((sn,Se)=>{"use strict";var Ht=z(),Ut=Te(),_t=Ae();Se.exports={XMLParser:Ut,XMLValidator:Ht,XMLBuilder:_t}});var qt={};Re(qt,{activate:()=>Yt,deactivate:()=>Xt});module.exports=ze(qt);var w=V(require("vscode"));var f=V(require("vscode"));var Me=V(Le());var O={"eflow:FCMSource":{color:"#4CAF50",label:"Input",category:"terminal"},"eflow:FCMSink":{color:"#F44336",label:"Output",category:"terminal"},"ComIbmCompute.msgnode":{color:"#2196F3",label:"Compute",category:"compute"},"ComIbmJavaCompute.msgnode":{color:"#3F51B5",label:"JavaCompute",category:"compute"},"ComIbmMQInput.msgnode":{color:"#FFFFFF",label:"MQ Input",category:"input"},"ComIbmMQOutput.msgnode":{color:"#FF9800",label:"MQ Output",category:"mq"},"ComIbmMQGet.msgnode":{color:"#FF9800",label:"MQ Get",category:"mq"},"ComIbmWSInput.msgnode":{color:"#FFFFFF",label:"WS Input",category:"input"},"ComIbmWSReply.msgnode":{color:"#9C27B0",label:"WS Reply",category:"http"},"ComIbmWSRequest.msgnode":{color:"#9C27B0",label:"WS Request",category:"http"},"ComIbmHTTPRequest.msgnode":{color:"#9C27B0",label:"HTTP Request",category:"http"},"ComIbmHTTPReply.msgnode":{color:"#9C27B0",label:"HTTP Reply",category:"http"},"ComIbmResetContentDescriptor.msgnode":{color:"#00BCD4",label:"Reset Content Descriptor",category:"other"},"ComIbmLabel.msgnode":{color:"#FF9800",label:"Label",category:"routing"},"ComIbmFilter.msgnode":{color:"#8BC34A",label:"Filter",category:"routing"},"ComIbmTryCatch.msgnode":{color:"#E91E63",label:"Try Catch",category:"error"},"ComIbmThrow.msgnode":{color:"#E91E63",label:"Throw",category:"error"},"ComIbmTrace.msgnode":{color:"#795548",label:"Trace",category:"other"},"ComIbmScheduler.msgnode":{color:"#FFC107",label:"Scheduler",category:"input"},"ComIbmSOAPInput.msgnode":{color:"#673AB7",label:"SOAP Input",category:"input"},"ComIbmSOAPReply.msgnode":{color:"#673AB7",label:"SOAP Reply",category:"output"},"ComIbmSOAPRequest.msgnode":{color:"#673AB7",label:"SOAP Request",category:"http"}};var $=class{constructor(){this.parser=new Me.XMLParser({ignoreAttributes:!1,attributeNamePrefix:"@_",parseAttributeValue:!1,trimValues:!0,parseTagValue:!0,allowBooleanAttributes:!0})}parse(e){let o=this.parser.parse(e)["ecore:EPackage"];if(!o)throw new Error("Invalid flow file: missing ecore:EPackage root element");let i=this.extractMetadata(o),r=o.eClassifiers?.composition;if(!r)throw new Error("Invalid flow file: missing composition element");let s=this.extractNodes(r,o),c=this.extractConnections(r,s),a=this.extractStickyNotes(o.eClassifiers);return{metadata:i,nodes:s,connections:c,stickyNotes:a}}extractMetadata(e){return{name:e["@_nsPrefix"]||"Unknown Flow",nsURI:e["@_nsURI"],nsPrefix:e["@_nsPrefix"],colorGraphic16:e.eClassifiers?.["@_colorGraphic16"],colorGraphic32:e.eClassifiers?.["@_colorGraphic32"],longDescription:e.eClassifiers?.longDescription,description:e.eClassifiers?.shortDescription}}extractNodes(e,n){let o=[],i=e.nodes;if(!i)return o;let r=Array.isArray(i)?i:[i];for(let s of r){let c=this.parseNode(s,n);c&&o.push(c)}return o}parseNode(e,n){let o=e["@_xmi:id"];if(!o)return null;let i=e["@_xmi:type"]||"Unknown",r=this.parseLocation(e["@_location"]),s=this.extractLabel(e,i),c={};for(let l in e)if(l.startsWith("@_")&&l!=="@_xmi:id"&&l!=="@_xmi:type"&&l!=="@_location"){let u=l.substring(2);c[u]=e[l]}let a=this.extractTerminals(i);return{id:o,type:i,label:s,location:r,properties:c,terminals:a}}parseLocation(e){if(!e)return{x:0,y:0};let n=e.split(",");return{x:parseInt(n[0]||"0",10),y:parseInt(n[1]||"0",10)}}extractLabel(e,n){if(n.includes("ComIbmLabel")&&e["@_labelName"])return e["@_labelName"];if(n.includes("ComIbmCompute")&&e.translation?.["@_string"])return e.translation["@_string"];if(e.translation?.["@_label"])return e.translation["@_label"];if(e.translation?.["@_string"])return e.translation["@_string"];if(e["@_label"])return e["@_label"];let o=O[n];if(o)return o.label;if(n.includes(".msgnode")){let i=n.match(/ComIbm(.+?)\.msgnode/);if(i)return i[1]}return n.includes("FCMSource")?"Input":n.includes("FCMSink")?"Output":n}extractTerminals(e){let n=[];return e.includes("FCMSource")?n.push({name:"OutTerminal.out",direction:"output",label:"out"}):e.includes("FCMSink")?n.push({name:"InTerminal.in",direction:"input",label:"in"}):e.includes("ComIbmTryCatch")?(n.push({name:"InTerminal.in",direction:"input",label:"in"}),n.push({name:"OutTerminal.try",direction:"output",label:"try"}),n.push({name:"OutTerminal.catch",direction:"output",label:"catch"})):e.includes("ComIbmFilter")?(n.push({name:"InTerminal.in",direction:"input",label:"in"}),n.push({name:"OutTerminal.true",direction:"output",label:"true"}),n.push({name:"OutTerminal.false",direction:"output",label:"false"}),n.push({name:"OutTerminal.unknown",direction:"output",label:"unknown"})):(n.push({name:"InTerminal.in",direction:"input",label:"in"}),n.push({name:"OutTerminal.out",direction:"output",label:"out"})),n}extractConnections(e,n){let o=[],i=e.connections;if(!i)return o;let r=Array.isArray(i)?i:[i];for(let s of r){let c=this.parseConnection(s);c&&o.push(c)}return o}parseConnection(e){let n=e["@_xmi:id"],o=e["@_sourceNode"],i=e["@_targetNode"],r=e["@_sourceTerminalName"]||"OutTerminal.out",s=e["@_targetTerminalName"]||"InTerminal.in";if(!n||!o||!i)return null;let c=this.parseBendPoints(e.bendPoints);return{id:n,sourceNodeId:o,targetNodeId:i,sourceTerminal:r,targetTerminal:s,bendPoints:c}}parseBendPoints(e){if(!e)return[];let n=[],o=e.split(",");for(let i=0;i<o.length;i+=2)i+1<o.length&&n.push({x:parseInt(o[i],10),y:parseInt(o[i+1],10)});return n}extractStickyNotes(e){let n=[],o=e?.stickyBoard;if(!o||!o.stickyNote)return n;let i=Array.isArray(o.stickyNote)?o.stickyNote:[o.stickyNote];for(let r of i){let s=this.parseLocation(r["@_location"]),c=r.body?.["@_string"]||"";c&&n.push({location:s,body:c})}return console.log("Parsed sticky notes:",n.length),n}};var I=class t{constructor(e,n,o){this.disposables=[];this.navigationHistory=[];this.extensionUri=e,this.documentUri=n,this.parser=new $;let i=n.path.split("/").pop()||"Flow";this.panel=f.window.createWebviewPanel(t.viewType,`Preview: ${i}`,o,{enableScripts:!0,retainContextWhenHidden:!0,localResourceRoots:[f.Uri.joinPath(this.extensionUri,"media")]}),this.update(),this.panel.onDidDispose(()=>this.dispose(),null,this.disposables),this.panel.onDidChangeViewState(()=>{this.panel.visible&&(t.currentPreview=this)},null,this.disposables),f.workspace.onDidChangeTextDocument(r=>{r.document.uri.toString()===this.documentUri.toString()&&this.update()},null,this.disposables),f.window.onDidChangeActiveTextEditor(r=>{r&&r.document.uri.toString()===this.documentUri.toString()&&this.update()},null,this.disposables),this.panel.webview.onDidReceiveMessage(async r=>{switch(r.type){case"openSource":f.window.showTextDocument(this.documentUri,f.ViewColumn.One);break;case"openNodeFile":await this.openNodeFile(r.node);break;case"navigateBack":this.navigateBack();break;case"navigateTo":this.navigateTo(r.index);break}},null,this.disposables)}static{this.viewType="aceFlowPreview"}static{this.activePreviews=new Map}static createOrShow(e,n,o){let i=n.toString(),r=t.activePreviews.get(i);if(r)return r.panel.reveal(o),t.currentPreview=r,r;let s=new t(e,n,o||f.ViewColumn.Two);return t.activePreviews.set(i,s),t.currentPreview=s,s}static updateCurrentPreview(e){t.currentPreview&&t.currentPreview.panel.visible&&t.currentPreview.updateDocument(e)}static hasVisiblePreview(){return t.currentPreview!==void 0&&t.currentPreview.panel.visible}updateDocument(e,n=!0){let o=this.documentUri.toString();if(t.activePreviews.delete(o),n){let s=this.documentUri.path.split("/").pop()||"Flow";this.navigationHistory.push({uri:this.documentUri,label:s})}this.documentUri=e;let i=e.path.split("/").pop()||"Flow";this.panel.title=`Preview: ${i}`;let r=e.toString();t.activePreviews.set(r,this),this.update()}navigateBack(){if(this.navigationHistory.length>0){let e=this.navigationHistory.pop();this.updateDocument(e.uri,!1),f.window.showTextDocument(e.uri,f.ViewColumn.One)}}navigateTo(e){if(e>=0&&e<this.navigationHistory.length){let n=this.navigationHistory.slice(0,e+1),o=n.pop();this.navigationHistory=n,this.updateDocument(o.uri,!1),f.window.showTextDocument(o.uri,f.ViewColumn.One)}}async update(){try{let n=(await f.workspace.openTextDocument(this.documentUri)).getText(),o=this.parser.parse(n);this.panel.webview.html=this.getHtmlContent(this.panel.webview,o)}catch(e){this.panel.webview.html=this.getErrorHtml(e.message)}}getHtmlContent(e,n){let o=e.asWebviewUri(f.Uri.joinPath(this.extensionUri,"media","styles.css")),i={};for(let[a,l]of Object.entries(O))i[a]=l.color;let r=JSON.stringify(n),s=JSON.stringify(this.navigationHistory.map(a=>a.label)),c=this.documentUri.path.split("/").pop()||"Flow";return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${e.cspSource} 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>ACE Flow Preview</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .diagram-panel {
      flex: 1;
      overflow: auto;
      background: var(--vscode-editor-background);
      position: relative;
      min-height: 0;
    }

    .properties-panel {
      height: 250px;
      overflow-y: auto;
      background: var(--vscode-sideBar-background);
      border-top: 1px solid var(--vscode-panel-border);
      padding: 16px;
      flex-shrink: 0;
      position: relative;
    }

    .zoom-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 4px;
      background: var(--vscode-sideBar-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 4px;
      z-index: 100;
    }

    .zoom-button {
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 3px;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
    }

    .zoom-button:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .zoom-level {
      padding: 6px 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      font-weight: 500;
      min-width: 45px;
      text-align: center;
    }

    #flowDiagram {
      min-width: 100%;
      min-height: 100%;
    }

    .node {
      cursor: pointer;
    }

    .node:hover rect {
      stroke-width: 2.5;
      filter: brightness(1.1);
    }

    .node.selected rect {
      stroke: var(--vscode-focusBorder);
      stroke-width: 3;
    }

    .node rect {
      stroke: var(--vscode-panel-border);
      stroke-width: 1.5;
      rx: 4;
    }

    .node text {
      fill: var(--vscode-editor-foreground);
      font-size: 12px;
      font-family: var(--vscode-font-family);
      pointer-events: none;
      user-select: none;
    }

    .node-label {
      fill: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      pointer-events: none;
      user-select: none;
    }

    .sticky-note {
      background-color: #FFEB3B;
      color: #000000;
      padding: 8px;
      border: 1px solid #FBC02D;
      border-radius: 2px;
      font-family: var(--vscode-font-family);
      font-size: 11px;
      line-height: 1.4;
      overflow: auto;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .connection {
      fill: none;
      stroke: var(--vscode-editorLineNumber-foreground);
      stroke-width: 1.5;
      cursor: pointer;
    }

    .connection:hover {
      stroke: var(--vscode-focusBorder);
      stroke-width: 2.5;
    }

    .connection-arrow {
      fill: var(--vscode-editorLineNumber-foreground);
    }

    .property-section {
      margin-bottom: 20px;
    }

    .property-section h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
    }

    .property-row {
      margin-bottom: 8px;
      padding: 6px;
      background: var(--vscode-input-background);
      border-radius: 3px;
    }

    .property-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 2px;
    }

    .property-value {
      font-size: 12px;
      color: var(--vscode-foreground);
      word-break: break-all;
    }

    .no-selection {
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 40px 20px;
    }

    .connection-tooltip {
      position: fixed;
      background: var(--vscode-editorHoverWidget-background);
      border: 1px solid var(--vscode-editorHoverWidget-border);
      color: var(--vscode-editorHoverWidget-foreground);
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      white-space: nowrap;
    }

    .flow-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .flow-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .flow-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .node-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .terminal-list {
      list-style: none;
      padding: 0;
    }

    .terminal-item {
      padding: 4px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .terminal-direction {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .terminal-direction.input {
      background: #4CAF50;
    }

    .terminal-direction.output {
      background: #2196F3;
    }

    .breadcrumb-bar {
      padding: 8px 16px;
      background: var(--vscode-titleBar-inactiveBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      flex-shrink: 0;
    }

    .breadcrumb-back {
      background: none;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      font-size: 14px;
    }

    .breadcrumb-back:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .breadcrumb-back:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .breadcrumb-items {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      overflow-x: auto;
    }

    .breadcrumb-item {
      background: none;
      border: none;
      color: var(--vscode-textLink-foreground);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 2px;
      white-space: nowrap;
    }

    .breadcrumb-item:hover {
      background: var(--vscode-list-hoverBackground);
      text-decoration: underline;
    }

    .breadcrumb-separator {
      color: var(--vscode-descriptionForeground);
    }

    .breadcrumb-current {
      color: var(--vscode-foreground);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="breadcrumb-bar" id="breadcrumbBar">
      <button class="breadcrumb-back" id="backButton" title="Go back" disabled>\u25C0</button>
      <div class="breadcrumb-items" id="breadcrumbItems">
        <span class="breadcrumb-current">${this.escapeHtml(c)}</span>
      </div>
    </div>
    <div class="diagram-panel" id="diagramPanel">
      <div class="zoom-controls">
        <button class="zoom-button" id="zoomOut" title="Zoom Out">\u2212</button>
        <div class="zoom-level" id="zoomLevel">100%</div>
        <button class="zoom-button" id="zoomIn" title="Zoom In">+</button>
        <button class="zoom-button" id="zoomReset" title="Reset Zoom">\u2299</button>
      </div>
      <svg id="flowDiagram"></svg>
      <div id="connectionTooltip" class="connection-tooltip"></div>
    </div>
    <div class="properties-panel" id="propertiesPanel">
      <div class="flow-header">
        <div class="flow-title">${this.escapeHtml(n.metadata.name)}</div>
        ${n.metadata.description?`<div class="flow-description">${this.escapeHtml(n.metadata.description)}</div>`:""}
      </div>
      <div class="no-selection">
        Click a node to view its properties
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const flowModel = ${r};
    const navigationHistory = ${s};
    const currentFileName = ${JSON.stringify(c)};
    let selectedNodeId = null;
    let zoomLevel = 1.0;
    let baseSvgWidth = 800;
    let baseSvgHeight = 600;
    let baseViewBox = { minX: 0, minY: 0, width: 800, height: 600 };

    // Initialize breadcrumbs
    function updateBreadcrumbs() {
      const backButton = document.getElementById('backButton');
      const breadcrumbItems = document.getElementById('breadcrumbItems');

      // Enable/disable back button
      backButton.disabled = navigationHistory.length === 0;

      // Build breadcrumb trail
      let html = '';
      navigationHistory.forEach((label, index) => {
        html += \`<button class="breadcrumb-item" onclick="navigateTo(\${index})">\${escapeHtml(label)}</button>\`;
        html += '<span class="breadcrumb-separator">/</span>';
      });
      html += \`<span class="breadcrumb-current">\${escapeHtml(currentFileName)}</span>\`;

      breadcrumbItems.innerHTML = html;
    }

    // Navigation functions
    function navigateBack() {
      vscode.postMessage({ type: 'navigateBack' });
    }

    function navigateTo(index) {
      vscode.postMessage({ type: 'navigateTo', index: index });
    }

    // Set up back button
    document.getElementById('backButton').addEventListener('click', navigateBack);

    // Initialize breadcrumbs on load
    updateBreadcrumbs();

    // Zoom functionality
    function updateZoom() {
      const svg = document.getElementById('flowDiagram');
      const zoomLevelDisplay = document.getElementById('zoomLevel');

      // Calculate new viewBox dimensions
      const centerX = baseViewBox.minX + baseViewBox.width / 2;
      const centerY = baseViewBox.minY + baseViewBox.height / 2;
      const newWidth = baseViewBox.width / zoomLevel;
      const newHeight = baseViewBox.height / zoomLevel;
      const newMinX = centerX - newWidth / 2;
      const newMinY = centerY - newHeight / 2;

      svg.setAttribute('viewBox', \`\${newMinX} \${newMinY} \${newWidth} \${newHeight}\`);
      zoomLevelDisplay.textContent = Math.round(zoomLevel * 100) + '%';
    }

    function zoomIn() {
      zoomLevel = Math.min(zoomLevel * 1.25, 5.0);
      updateZoom();
    }

    function zoomOut() {
      zoomLevel = Math.max(zoomLevel / 1.25, 0.1);
      updateZoom();
    }

    function zoomReset() {
      zoomLevel = 1.0;
      updateZoom();
    }

    // Set up zoom buttons
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    document.getElementById('zoomReset').addEventListener('click', zoomReset);

    // Properties panel when a node is selected
    function showPropertiesPanel() {
      const diagramPanel = document.getElementById('diagramPanel');
      const propertiesPanel = document.getElementById('propertiesPanel');

      // Store the current scroll position
      const scrollTop = diagramPanel.scrollTop;
      const scrollLeft = diagramPanel.scrollLeft;

      // Show the properties panel
      propertiesPanel.classList.remove('hidden');

      // Restore scroll position after the DOM has updated
      requestAnimationFrame(() => {
        diagramPanel.scrollTop = scrollTop;
        diagramPanel.scrollLeft = scrollLeft;
      });
    }

    // Hide properties panel
    function hidePropertiesPanel() {
      const diagramPanel = document.getElementById('diagramPanel');
      const propertiesPanel = document.getElementById('propertiesPanel');

      // Store the current scroll position
      const scrollTop = diagramPanel.scrollTop;
      const scrollLeft = diagramPanel.scrollLeft;

      // Hide the properties panel
      propertiesPanel.classList.add('hidden');

      // Restore scroll position after the DOM has updated
      requestAnimationFrame(() => {
        diagramPanel.scrollTop = scrollTop;
        diagramPanel.scrollLeft = scrollLeft;
      });

      // Clear selection
      selectedNodeId = null;
      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('selected');
      });
    }

    // Render the flow diagram
    function renderFlow() {
      if (!flowModel || !flowModel.nodes) {
        return;
      }

      const svg = document.getElementById('flowDiagram');
      const nodes = flowModel.nodes;
      const connections = flowModel.connections;

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.location.x);
        minY = Math.min(minY, node.location.y);
        maxX = Math.max(maxX, node.location.x + 120);
        maxY = Math.max(maxY, node.location.y + 90); // Extra space for label below node
      });

      // Include sticky notes in bounds calculation
      if (flowModel.stickyNotes && flowModel.stickyNotes.length > 0) {
        flowModel.stickyNotes.forEach(note => {
          minX = Math.min(minX, note.location.x);
          minY = Math.min(minY, note.location.y);
          maxX = Math.max(maxX, note.location.x + 300); // sticky note width
          maxY = Math.max(maxY, note.location.y + 120); // sticky note height
        });
      }

      const padding = 50;
      const width = maxX - minX + 2 * padding;
      const height = maxY - minY + 2 * padding;

      // Store base viewBox for zoom functionality
      baseViewBox = { minX: minX - padding, minY: minY - padding, width: width, height: height };
      baseSvgWidth = Math.max(width, 800);
      baseSvgHeight = Math.max(height, 600);

      svg.setAttribute('viewBox', \`\${minX - padding} \${minY - padding} \${width} \${height}\`);
      svg.setAttribute('width', baseSvgWidth);
      svg.setAttribute('height', baseSvgHeight);

      // Create fragment for batch DOM operations
      const fragment = document.createDocumentFragment();

      // Define arrow marker
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3, 0 6');
      polygon.setAttribute('class', 'connection-arrow');
      marker.appendChild(polygon);
      defs.appendChild(marker);
      fragment.appendChild(defs);

      // Pre-index nodes for faster lookup
      const nodeMap = new Map();
      nodes.forEach(node => nodeMap.set(node.id, node));

      // Render connections
      connections.forEach(conn => {
        const sourceNode = nodeMap.get(conn.sourceNodeId);
        const targetNode = nodeMap.get(conn.targetNodeId);

        if (sourceNode && targetNode) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const startX = sourceNode.location.x + 50;
          const startY = sourceNode.location.y + 20;
          const endX = targetNode.location.x;
          const endY = targetNode.location.y + 20;

          let d = \`M \${startX} \${startY}\`;

          // Add bend points if they exist
          if (conn.bendPoints && conn.bendPoints.length > 0) {
            // Bendpoints are stored as relative offsets:
            // First bendpoint is relative to the source node position
            // Second bendpoint (if exists) is relative to the target node position
            conn.bendPoints.forEach((bendPoint, index) => {
              let absoluteX, absoluteY;
              if (index === 0) {
                // First bendpoint is relative to source
                absoluteX = sourceNode.location.x + bendPoint.x;
                absoluteY = sourceNode.location.y + bendPoint.y;
              } else {
                // Second and subsequent bendpoints are relative to target
                absoluteX = targetNode.location.x + bendPoint.x;
                absoluteY = targetNode.location.y + bendPoint.y;
              }
              d += \` L \${absoluteX} \${absoluteY}\`;
            });
            // Draw line to end point
            d += \` L \${endX} \${endY}\`;
          } else {
            // No bend points, use smooth curve
            const midX = (startX + endX) / 2;
            d = \`M \${startX} \${startY} Q \${midX} \${startY}, \${midX} \${(startY + endY) / 2} T \${endX} \${endY}\`;
          }

          path.setAttribute('d', d);
          path.setAttribute('class', 'connection');
          path.setAttribute('marker-end', 'url(#arrowhead)');

          // Store tooltip data
          const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
          const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
          path.setAttribute('data-tooltip', \`\${sourceTerminal} \u2192 \${targetTerminal}\`);

          fragment.appendChild(path);
        }
      });

      // Render nodes
      nodes.forEach(node => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node');
        g.setAttribute('data-node-id', node.id);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', node.location.x);
        rect.setAttribute('y', node.location.y);
        rect.setAttribute('width', '50');
        rect.setAttribute('height', '40');
        rect.setAttribute('fill', getNodeColor(node.type));

        // Add SVG icon inside the node
        const iconSvg = getNodeIcon(node.type);
        const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        iconGroup.setAttribute('transform', \`translate(\${node.location.x + 25}, \${node.location.y + 20})\`);
        iconGroup.innerHTML = iconSvg;

        // Add label below the node
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', node.location.x + 25);
        label.setAttribute('y', node.location.y + 52);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('class', 'node-label');
        label.textContent = node.label;

        g.appendChild(rect);
        g.appendChild(iconGroup);
        g.appendChild(label);

        g.addEventListener('click', () => selectNode(node.id));
        g.addEventListener('dblclick', () => {
          vscode.postMessage({ type: 'openNodeFile', node: node });
        });

        fragment.appendChild(g);
      });

      // Render sticky notes
      if (flowModel.stickyNotes && flowModel.stickyNotes.length > 0) {
        console.log('Rendering', flowModel.stickyNotes.length, 'sticky notes');
        flowModel.stickyNotes.forEach(note => {
          console.log('Sticky note at', note.location.x, note.location.y, 'body length:', note.body.length);
          const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          foreignObject.setAttribute('x', String(note.location.x));
          foreignObject.setAttribute('y', String(note.location.y));
          foreignObject.setAttribute('width', '300');
          foreignObject.setAttribute('height', '120');

          const noteDiv = document.createElement('div');
          noteDiv.className = 'sticky-note';
          noteDiv.textContent = note.body;

          foreignObject.appendChild(noteDiv);
          fragment.appendChild(foreignObject);
        });
      } else {
        console.log('No sticky notes to render');
      }

      // Replace all content at once for better performance
      svg.innerHTML = '';
      svg.appendChild(fragment);

      // Add instant tooltip handlers to connections
      const tooltip = document.getElementById('connectionTooltip');
      document.querySelectorAll('.connection').forEach(conn => {
        conn.addEventListener('mouseenter', (e) => {
          const text = conn.getAttribute('data-tooltip');
          if (tooltip && text) {
            tooltip.textContent = text;
            tooltip.style.display = 'block';
          }
        });
        conn.addEventListener('mousemove', (e) => {
          if (tooltip) {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
          }
        });
        conn.addEventListener('mouseleave', () => {
          if (tooltip) {
            tooltip.style.display = 'none';
          }
        });
      });
    }

    function getNodeColor(type) {
      const colors = ${JSON.stringify(i)};

      // Direct match
      if (colors[type]) {
        return colors[type];
      }

      // Try to extract base type (e.g., "ComIbmLabel.msgnode:FCMComposite_1" -> "ComIbmLabel.msgnode")
      if (type.includes(':')) {
        const baseType = type.split(':')[0];
        if (colors[baseType]) {
          return colors[baseType];
        }
      }

      // Try to match by checking if any color key is a prefix of the type
      for (const [key, color] of Object.entries(colors)) {
        if (type.startsWith(key)) {
          return color;
        }
      }

      return '#607D8B';
    }

    function getNodeIcon(type) {
      const baseType = type.includes(':') ? type.split(':')[0] : type;
      const iconSize = 24;
      const half = iconSize / 2;

      // Return SVG path elements (white fill, centered at 0,0)
      if (baseType.includes('ComIbmLabel')) {
        // Tag icon
        return \`<path d="M-10,-8 L8,-8 L12,0 L8,8 L-10,8 Z M4,-2 A2,2 0 1,1 4,2 A2,2 0 1,1 4,-2" fill="white"/>\`;
      }
      if (baseType.includes('ComIbmCompute')) {
        // Gear icon
        return \`<circle cx="0" cy="0" r="6" fill="white"/>
                <rect x="-2" y="-10" width="4" height="4" fill="white"/>
                <rect x="-2" y="6" width="4" height="4" fill="white"/>
                <rect x="-10" y="-2" width="4" height="4" fill="white"/>
                <rect x="6" y="-2" width="4" height="4" fill="white"/>\`;
      }
      if (baseType.includes('JavaCompute')) {
        // Coffee cup icon
        return \`<path d="M-8,-6 L8,-6 L6,6 C6,8 4,10 0,10 C-4,10 -6,8 -6,6 Z M8,-2 L12,-2 C12,2 10,4 8,4" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('MQInput') || baseType.includes('MQGet')) {
        // Inbox icon
        return \`<path d="M-10,-8 L10,-8 L10,8 L-10,8 Z M-10,0 L-4,0 L-2,4 L2,4 L4,0 L10,0" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('MQOutput')) {
        // Send icon
        return \`<path d="M-10,-8 L10,0 L-10,8 Z M0,0 L0,8" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('HTTPRequest') || baseType.includes('WSRequest')) {
        // Globe icon
        return \`<circle cx="0" cy="0" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M0,-10 Q4,-5 0,0 Q-4,5 0,10 M0,-10 Q-4,-5 0,0 Q4,5 0,10 M-10,0 L10,0" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('HTTPReply') || baseType.includes('WSReply')) {
        // Reply arrow
        return \`<path d="M8,-8 L-8,0 L8,8 M-8,0 L10,0" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('Filter')) {
        // Funnel icon
        return \`<path d="M-10,-8 L10,-8 L4,0 L4,10 L-4,10 L-4,0 Z" fill="white"/>\`;
      }
      if (baseType.includes('TryCatch')) {
        // Shield icon
        return \`<path d="M0,-10 L8,-6 L8,2 C8,6 4,10 0,10 C-4,10 -8,6 -8,2 L-8,-6 Z" fill="white"/>\`;
      }
      if (baseType.includes('Throw')) {
        // Warning triangle
        return \`<path d="M0,-10 L10,8 L-10,8 Z M-1,0 L1,0 L1,4 L-1,4 Z M0,6 A1,1 0 1,1 0,7 A1,1 0 1,1 0,6" fill="white"/>\`;
      }
      if (baseType.includes('Trace')) {
        // Document icon
        return \`<path d="M-6,-10 L4,-10 L8,-6 L8,10 L-6,10 Z M4,-10 L4,-6 L8,-6" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('ResetContentDescriptor')) {
        // Refresh icon
        return \`<path d="M8,-4 A6,6 0 1,0 8,4 M8,-6 L8,0 L2,0" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>\`;
      }
      if (baseType.includes('Scheduler')) {
        // Clock icon
        return \`<circle cx="0" cy="0" r="10" fill="none" stroke="white" stroke-width="2"/>
                <path d="M0,0 L0,-6 M0,0 L4,4" stroke="white" stroke-width="2" stroke-linecap="round"/>\`;
      }
      if (baseType.includes('SOAP')) {
        // Envelope icon
        return \`<path d="M-10,-6 L10,-6 L10,8 L-10,8 Z M-10,-6 L0,2 L10,-6" fill="none" stroke="white" stroke-width="2"/>\`;
      }
      if (baseType.includes('FCMSource')) {
        // Play icon
        return \`<path d="M-6,-8 L8,0 L-6,8 Z" fill="white"/>\`;
      }
      if (baseType.includes('FCMSink')) {
        // Stop icon
        return \`<rect x="-8" y="-8" width="16" height="16" fill="white"/>\`;
      }
      if (baseType.includes('Subflow') || baseType.includes('SubFlow')) {
        // Package icon
        return \`<path d="M-8,-8 L8,-8 L8,8 L-8,8 Z M-8,0 L8,0 M0,-8 L0,8" fill="none" stroke="white" stroke-width="2"/>\`;
      }

      // Default: circle
      return \`<circle cx="0" cy="0" r="8" fill="white"/>\`;
    }

    function truncateText(text, maxLength) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    function selectNode(nodeId) {
      selectedNodeId = nodeId;

      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelector(\`[data-node-id="\${nodeId}"]\`)?.classList.add('selected');

      const node = flowModel.nodes.find(n => n.id === nodeId);
      if (node) {
        showPropertiesPanel();
        showProperties(node);
      }
    }

    function showProperties(node) {
      const panel = document.getElementById('propertiesPanel');

      let html = '<div class="flow-header">';
      html += \`<div class="node-badge" style="background-color: \${getNodeColor(node.type)}; color: white;">\${node.type.split('.')[0].replace('ComIbm', '')}</div>\`;
      html += \`<div class="flow-title">\${escapeHtml(node.label)}</div>\`;
      html += '</div>';

      html += '<div class="property-section">';
      html += '<h3>General</h3>';
      html += \`<div class="property-row"><div class="property-label">ID</div><div class="property-value">\${escapeHtml(node.id)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Type</div><div class="property-value">\${escapeHtml(node.type)}</div></div>\`;
      html += \`<div class="property-row"><div class="property-label">Location</div><div class="property-value">x: \${node.location.x}, y: \${node.location.y}</div></div>\`;
      html += '</div>';

      // Show all connections for this node
      const incomingConns = flowModel.connections.filter(c => c.targetNodeId === node.id);
      const outgoingConns = flowModel.connections.filter(c => c.sourceNodeId === node.id);

      if (incomingConns.length > 0 || outgoingConns.length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Connections</h3>';

        if (incomingConns.length > 0) {
          html += '<div style="margin-bottom: 8px;"><strong>Incoming:</strong></div>';
          html += '<ul class="terminal-list">';
          incomingConns.forEach(conn => {
            const sourceNode = flowModel.nodes.find(n => n.id === conn.sourceNodeId);
            const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
            const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
            html += \`<li class="terminal-item">\`;
            html += \`<span class="terminal-direction in"></span>\`;
            html += \`<span>\${escapeHtml(targetTerminal)} \u2190 \${escapeHtml(sourceNode?.label || conn.sourceNodeId)} (\${escapeHtml(sourceTerminal)})</span>\`;
            html += '</li>';
          });
          html += '</ul>';
        }

        if (outgoingConns.length > 0) {
          html += '<div style="margin-bottom: 8px; margin-top: 12px;"><strong>Outgoing:</strong></div>';
          html += '<ul class="terminal-list">';
          outgoingConns.forEach(conn => {
            const targetNode = flowModel.nodes.find(n => n.id === conn.targetNodeId);
            const sourceTerminal = conn.sourceTerminal ? (conn.sourceTerminal.split('.').pop() || conn.sourceTerminal) : 'unknown';
            const targetTerminal = conn.targetTerminal ? (conn.targetTerminal.split('.').pop() || conn.targetTerminal) : 'unknown';
            html += \`<li class="terminal-item">\`;
            html += \`<span class="terminal-direction out"></span>\`;
            html += \`<span>\${escapeHtml(sourceTerminal)} \u2192 \${escapeHtml(targetNode?.label || conn.targetNodeId)} (\${escapeHtml(targetTerminal)})</span>\`;
            html += '</li>';
          });
          html += '</ul>';
        }

        html += '</div>';
      }

      if (Object.keys(node.properties).length > 0) {
        html += '<div class="property-section">';
        html += '<h3>Properties</h3>';
        for (const [key, value] of Object.entries(node.properties)) {
          if (value !== undefined && value !== null && value !== '') {
            const formattedValue = formatPropertyValue(key, value);
            html += \`<div class="property-row"><div class="property-label">\${escapeHtml(camelCaseToSentence(key))}</div><div class="property-value">\${escapeHtml(formattedValue)}</div></div>\`;
          }
        }
        html += '</div>';
      }

      panel.innerHTML = html;
    }

    function escapeHtml(text) {
      if (text === null || text === undefined) {
        return '';
      }
      const div = document.createElement('div');
      div.textContent = String(text);
      return div.innerHTML;
    }

    function camelCaseToSentence(text) {
      if (!text) return '';

      // Insert space before each capital letter, then trim and lowercase
      const withSpaces = text.replace(/([A-Z])/g, ' $1').trim();
      const lower = withSpaces.toLowerCase();

      // Capitalize only the first letter
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    function formatPropertyValue(key, value) {
      // Special handling for computeMode property
      if (key === 'computeMode' && typeof value === 'string') {
        const modeMap = {
          'destination': 'LocalEnvironment',
          'destinationAndMessage': 'LocalEnvironment and Message',
          'exception': 'Exception',
          'exceptionAndMessage': 'Exception and Message',
          'message': 'Message',
          'localEnvironmentAndException': 'Exception and LocalEnvironment',
          'all': 'All'
        };
        return modeMap[value] || value;
      }
      return String(value);
    }

    renderFlow();
  </script>
</body>
</html>`}getErrorHtml(e){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .error-container {
      text-align: center;
      padding: 40px;
    }
    .error-icon {
      font-size: 48px;
      color: var(--vscode-errorForeground);
      margin-bottom: 20px;
    }
    .error-message {
      color: var(--vscode-errorForeground);
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-icon">\u26A0\uFE0F</div>
    <div class="error-message">Failed to parse flow file</div>
    <div>${this.escapeHtml(e)}</div>
  </div>
</body>
</html>`}async openNodeFile(e){try{let n=null;if(e.properties?.computeExpression){let i=e.properties.computeExpression.match(/esql:\/\/routine\/(.+)#(.+?)\.Main/);if(i){let r=i[1].replace(/\./g,"/"),s=i[2];n=`**/${r}/${s}.esql`}}if(!n&&e.type.includes(".subflow:")&&(n=`**/${e.type.split(":")[0].replace(/_/g,"/").replace(".subflow","")}.subflow`),n){let o=await f.workspace.findFiles(n,null,1);if(o.length>0){let i=await f.workspace.openTextDocument(o[0]);await f.window.showTextDocument(i,f.ViewColumn.One)}else f.window.showWarningMessage(`Could not find file: ${n}`)}else f.window.showInformationMessage("No associated file found for this node type")}catch(n){f.window.showErrorMessage(`Error opening file: ${n.message}`)}}escapeHtml(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}dispose(){let e=this.documentUri.toString();for(t.activePreviews.delete(e),this.panel.dispose();this.disposables.length;){let n=this.disposables.pop();n&&n.dispose()}}};function Yt(t){console.log("ESQL Language & ACE Flow Visualizer extension is now active"),t.subscriptions.push(w.commands.registerCommand("aceFlowVisualizer.openPreview",()=>{let e=w.window.activeTextEditor;if(!e){w.window.showErrorMessage("No active editor");return}let n=e.document;if(!Q(n)){w.window.showErrorMessage("Active file is not a .msgflow or .subflow file");return}I.createOrShow(t.extensionUri,n.uri,w.ViewColumn.Active)})),t.subscriptions.push(w.commands.registerCommand("aceFlowVisualizer.openPreviewToSide",()=>{let e=w.window.activeTextEditor;if(!e){w.window.showErrorMessage("No active editor");return}let n=e.document;if(!Q(n)){w.window.showErrorMessage("Active file is not a .msgflow or .subflow file");return}I.createOrShow(t.extensionUri,n.uri,w.ViewColumn.Beside)})),t.subscriptions.push(w.window.onDidChangeActiveTextEditor(e=>{e&&Q(e.document)&&I.hasVisiblePreview()&&I.updateCurrentPreview(e.document.uri)}))}function Q(t){let e=t.fileName.toLowerCase();return e.endsWith(".msgflow")||e.endsWith(".subflow")}function Xt(){console.log("ESQL Language & ACE Flow Visualizer extension is now deactivated")}0&&(module.exports={activate,deactivate});
