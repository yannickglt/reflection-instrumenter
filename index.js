var _ = require('lodash');
var esprima = require('esprima');
var crypto = require('crypto');
var tempWrite = require('temp-write');

var _INSTRUMENT_TEMPLATE = "<%= content %>\nif(<%= trackerVar %>){<%= trackerVar %>('<%= filePath %>',<%= syntaxTree %>,'<%= fullPath %>');}";
var _ADAPTER_TEMPLATE = "var <%= trackerVar %> = function (f,n,p) { Reflection.__files[f] = {node:n,path:p}; };";
var _trackerVar;

function instrument(content, filePath, fullPath) {

  var syntaxTree = esprima.parse(String(content), {
    loc: true
  });

  return _.template(_INSTRUMENT_TEMPLATE)({
    content: content,
    trackerVar: getTrackerVar(),
    syntaxTree: JSON.stringify(syntaxTree),
    filePath: filePath,
    fullPath: fullPath
  });
}

function adapter() {
  var compiledTemplate = _.template(_ADAPTER_TEMPLATE)({ trackerVar: getTrackerVar() });
  return tempWrite.sync(compiledTemplate, 'reflection-adapter.js');
}

function framework() {
  // Load the browserify version of the esreflect library
  return require.resolve('esreflect/dist/esreflect');
}

function getTrackerVar() {
  if (!_trackerVar) {
    var hash = crypto.createHash('md5');
    var suffix = hash.digest('base64');
    suffix = suffix.replace(/=/g, '').replace(/\+/g, '_').replace(/\//g, '$');
    _trackerVar = '__reflect_' + suffix;
  }
  return _trackerVar;
}

module.exports = {
  instrument: instrument,
  adapter: adapter,
  framework: framework
};
