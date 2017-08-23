const text_analyzer = require('pelias-text-analyzer');
const postal = require('node-postal');
const _ = require('lodash');
const iso3166 = require('iso3166-1');
const logger = require('pelias-logger').get('api');

function setup(should_execute) {
  function controller( req, res, next ){
    // bail early if req/res don't pass conditions for execution
    if (!should_execute(req, res)) {
      return next();
    }

    // parse text with query parser
    const parsed_text = text_analyzer.parse(req.clean.text);

    if (parsed_text !== undefined) {
      // if a known ISO2 country was parsed, convert it to ISO3
      if (_.has(parsed_text, 'country') && iso3166.is2(_.toUpper(parsed_text.country))) {
        parsed_text.country = iso3166.to3(_.toUpper(parsed_text.country));
      }
      
      // Check if there is a street element
        if(_.has(parsed_text, 'street')) {
            parsed_text.street = convertStreet(parsed_text.street);
        }
            
      
      req.clean.parsed_text = parsed_text;
    }

    return next();

  }

  return controller;
}

function convertStreet(streetIn) {
    var street = streetIn;
    if(streetIn.endsWith('str') || streetIn.endsWith('str.')) {
        // we need to add a space else libpostal cannot cope with the interpretation.
        street = streetIn.substr(0, streetIn.lastIndexOf('str')) + ' ' + streetIn.substr(streetIn.lastIndexOf('str'));
        var hasSpace=false;
        if(street.indexOf('  ') !== -1) {
            hasSpace=true;
        }
        var parsed = postal.expand.expand_address(street)[0];
        // Now remove the space that we added. Libpostal removes excess whitespace so we cannot check for a double space
        if(!hasSpace) {
            parsed = parsed.substr(0, parsed.lastIndexOf(' str')) + parsed.substr(parsed.lastIndexOf('str'));
        }
                      
        street = parsed;
    } else {
        street = postal.expand.expand_address(street)[0];
    }
    
    return street;
}

module.exports = setup;
